import axios from 'axios';

class Pterodactyl {
    /**
     * Membuat instance panel Pterodactyl.
     * @param {string} apiKey - API Key Application Anda (dari /admin/api)
     * @param {string} panelUrl - URL panel Anda (mis. https://panel.domain.com)
     * @param {string|number} nestId - ID Nest default
     * @param {string|number} eggId - ID Egg default
     * @param {string|number} locationId - ID Lokasi default
     */
    constructor(apiKey, panelUrl, nestId, eggId, locationId) {
        this.apiKey = apiKey;
        this.panelUrl = panelUrl.replace(/\/$/, '');
        this.nestId = nestId;
        this.eggId = eggId;
        this.locationId = locationId;
    }

    /**
     * @returns {object} - Objek headers default untuk request API
     * @private
     */
    get _headers() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }
    
    /**
     * @private
     * Mendapatkan detail Egg (internal).
     */
    async _getEggDetails() {
        try {
            const { data } = await axios.get(
                `${this.panelUrl}/api/application/nests/${this.nestId}/eggs/${this.eggId}?include=variables`,
                { headers: this._headers }
            );

            const attr = data.attributes;
            const environment = attr.relationships.variables.data.reduce((env, variable) => {
                env[variable.attributes.env_variable] = variable.attributes.default_value;
                return env;
            }, {});

            return {
                docker_image: attr.docker_image,
                startup: attr.startup,
                environment: environment,
            };
        } catch (err) {
            return { message: `Gagal mendapatkan detail Egg: ${err.response?.data?.errors?.[0]?.detail || err.message}` };
        }
    }

    /**
     * @private
     * Mencari alokasi port yang tersedia (internal).
     */
    async _findAvailableAllocation() {
        try {
            const { data: nodes } = await axios.get(
                `${this.panelUrl}/api/application/nodes?per_page=200`,
                { headers: this._headers }
            );

            for (const node of nodes.data) {
                if (Number(node.attributes.location_id) === Number(this.locationId)) {
                    const nodeId = node.attributes.id;
                    const { data: allocations } = await axios.get(
                        `${this.panelUrl}/api/application/nodes/${nodeId}/allocations?per_page=200`,
                        { headers: this._headers }
                    );

                    const availableAllocation = allocations.data.find(alloc => !alloc.attributes.assigned);

                    if (availableAllocation) {
                        return availableAllocation.attributes;
                    }
                }
            }

            return { message: `Tidak ada alokasi (port) tersedia yang ditemukan di Lokasi ID: ${this.locationId}` };

        } catch (err) {
            return { message: `Gagal saat proses mencari alokasi: ${err.response?.data?.errors?.[0]?.detail || err.message}` };
        }
    }

    /**
     * Mencari user berdasarkan username.
     * @returns {Promise<object>} Atribut user jika ditemukan, atau objek error.
     */
    async findUserByUsername(username) {
        try {
            const { data } = await axios.get(
                `${this.panelUrl}/api/application/users?filter[username]=${username}`,
                { headers: this._headers }
            );

            if (data.data.length > 0) {
                return data.data[0].attributes;
            }

            // Ubah return null menjadi return error object
            return { message: `User '${username}' tidak ditemukan.` };
        } catch (err) {
            return { message: `Gagal mencari user '${username}': ${err.response?.data?.errors?.[0]?.detail || err.message}` };
        }
    }

    /**
     * Membuat user baru.
     * @returns {Promise<object>} Atribut user jika berhasil, atau objek error.
     */
    async createUser({ username, email, firstName, lastName, password, admin = false }) {
        try {
            const { data } = await axios.post(`${this.panelUrl}/api/application/users`, {
                username: username,
                email: email,
                first_name: firstName,
                last_name: lastName,
                password: password,
                root_admin: admin,
            }, { headers: this._headers });

            return data.attributes;
        } catch (err) {
            if (err.response?.data?.errors?.[0]?.code === 'UnprocessableEntityHttpException') {
                return await this.findUserByUsername(username);
            }
            return { message: `Gagal membuat user: ${err.response?.data?.errors?.[0]?.detail || err.message}` };
        }
    }

    /**
     * Membuat user dengan status admin.
     */
    async createAdmin(options) {
        return this.createUser({ ...options, admin: true });
    }

    /**
     * Mendapatkan daftar semua user.
     * @returns {Promise<Array<object>|object>} Array dari atribut user, atau objek error.
     */
    async listUsers() {
        try {
            const { data } = await axios.get(
                `${this.panelUrl}/api/application/users`,
                { headers: this._headers }
            );
            return data.data.map(user => user.attributes);
        } catch (err) {
            return { message: `Gagal mengambil daftar user: ${err.response?.data?.errors?.[0]?.detail || err.message}` };
        }
    }

    /**
     * Menghapus user berdasarkan ID.
     * @returns {Promise<true|object>} True jika berhasil, atau objek error.
     */
    async deleteUser(userId) {
        try {
            await axios.delete(
                `${this.panelUrl}/api/application/users/${userId}`,
                { headers: this._headers }
            );
            return true;
        } catch (err) {
            return { message: `Gagal menghapus user ID ${userId}: ${err.response?.data?.errors?.[0]?.detail || err.message}` };
        }
    }

    /**
     * Membuat user BARU dan server BARU untuk user tersebut.
     * @returns {Promise<object>} Detail server jika berhasil, atau objek error.
     */
    async createServer({ name, password, ram, disk, cpuPercent, admin = false }) {
        const safeUsername = name.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        const email = `${safeUsername}@gmail.com`;

        const user = await this.createUser({
            username: safeUsername,
            email,
            firstName: name,
            lastName: 'User',
            password,
            admin
        });
        if (user.message) {
            return user; 
        }

        const eggDetails = await this._getEggDetails();
        if (eggDetails.message) {
            return eggDetails;
        }

        const allocation = await this._findAvailableAllocation();
        if (allocation.message) {
            return allocation;
        }

        try {
            const serverPayload = {
                name: `${name}'s Server`,
                user: user.id,
                egg: this.eggId,
                docker_image: eggDetails.docker_image,
                startup: eggDetails.startup,
                environment: eggDetails.environment,
                limits: {
                    memory: ram,
                    swap: 0,
                    disk: disk,
                    io: 500,
                    cpu: cpuPercent,
                },
                feature_limits: {
                    databases: 1,
                    allocations: 1,
                    backups: 1,
                },
                allocation: {
                    default: allocation.id,
                },
            };

            const { data: serverData } = await axios.post(
                `${this.panelUrl}/api/application/servers`,
                serverPayload,
                { headers: this._headers }
            );

            return {
                username: safeUsername,
                password: password,
                serverIdentifier: serverData.attributes.identifier,
                panelUrl: this.panelUrl,
            };

        } catch (err) {
            return { message: `Gagal membuat server: ${err.response?.data?.errors?.[0]?.detail || err.message}` };
        }
    }

    /**
     * Mendapatkan daftar semua server.
     * @returns {Promise<Array<object>|object>} Array dari atribut server, atau objek error.
     */
    async listServers() {
        try {
            const { data } = await axios.get(
                `${this.panelUrl}/api/application/servers`,
                { headers: this._headers }
            );
            return data.data.map(server => server.attributes);
        } catch (err) {
            return { message: `Gagal mengambil daftar server: ${err.response?.data?.errors?.[0]?.detail || err.message}` };
        }
    }

    /**
     * Menghapus server berdasarkan ID.
     * @returns {Promise<true|object>} True jika berhasil, atau objek error.
     */
    async deleteServer(serverId) {
        try {
            await axios.delete(
                `${this.panelUrl}/api/application/servers/${serverId}`,
                { headers: this._headers }
            );
            return true;
        } catch (err) {
            return { message: `Gagal menghapus server ID ${serverId}: ${err.response?.data?.errors?.[0]?.detail || err.message}` };
        }
    }
}

export default Pterodactyl;