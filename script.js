document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const loginMessage = document.getElementById('login-message');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    const navLinks = document.querySelectorAll('.sidebar nav ul li a');
    const sections = document.querySelectorAll('main.content section');
    const currentSectionTitle = document.getElementById('current-section-title');
    const addItemButton = document.getElementById('add-item-button');
    const exportDataButton = document.getElementById('export-data-button');

    // Modales y botones de guardar/cancelar
    const clientFormContainer = document.getElementById('client-form-container');
    const saveClientButton = document.getElementById('save-client-button');
    const cancelClientButton = document.getElementById('cancel-client-button');
    const clientTableBody = document.querySelector('#clients-table tbody');
    const searchClients = document.getElementById('search-clients');

    const providerFormContainer = document.getElementById('provider-form-container');
    const saveProviderButton = document.getElementById('save-provider-button');
    const cancelProviderButton = document.getElementById('cancel-provider-button');
    const providerTableBody = document.querySelector('#providers-table tbody');
    const providerAccountsSelect = document.getElementById('provider-accounts');
    const providerUnitCostInput = document.getElementById('provider-unit-cost');
    const providerTotalAmountInput = document.getElementById('provider-total-amount');
    const searchProviders = document.getElementById('search-providers');

    const contractFormContainer = document.getElementById('contract-form-container');
    const saveContractButton = document.getElementById('save-contract-button');
    const cancelContractButton = document.getElementById('cancel-contract-button');
    const contractTableBody = document.querySelector('#contracts-table tbody');
    const contractClientSelect = document.getElementById('contract-client');
    const contractProviderSelect = document.getElementById('contract-provider');
    const searchContracts = document.getElementById('search-contracts');
    const filterContractsStatus = document.getElementById('filter-contracts-status');
    // NUEVO: Select para servicios en contratos
    const contractServiceSelect = document.getElementById('contract-service');

    const notificationsList = document.getElementById('notifications-list');

    // Variables para Servicios
    const serviceFormContainer = document.getElementById('service-form-container');
    const saveServiceButton = document.getElementById('save-service-button');
    const cancelServiceButton = document.getElementById('cancel-service-button');
    const serviceTableBody = document.querySelector('#services-table tbody');
    // ELIMINADO: serviceProviderSelect ya no es necesario aquí
    const searchServices = document.getElementById('search-services');

    // Datos (simulando una base de datos con localStorage)
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    let providers = JSON.parse(localStorage.getItem('providers')) || [];
    let contracts = JSON.parse(localStorage.getItem('contracts')) || [];
    // MODIFICADO: La estructura de services ahora es solo {id, name}
    let services = JSON.parse(localStorage.getItem('services')) || [];

    let nextClientId = JSON.parse(localStorage.getItem('nextClientId')) || 1;
    let nextProviderId = JSON.parse(localStorage.getItem('nextProviderId')) || 1;
    let nextContractId = JSON.parse(localStorage.getItem('nextContractId')) || 1;
    let nextServiceId = JSON.parse(localStorage.getItem('nextServiceId')) || 1;

    const USERS = {
        'Valeria2704': 'Val2704',
        'Dagner2704': 'Dani2704'
    };

    // --- Funciones de Utilidad ---

    function saveToLocalStorage() {
        localStorage.setItem('clients', JSON.stringify(clients));
        localStorage.setItem('providers', JSON.stringify(providers));
        localStorage.setItem('contracts', JSON.stringify(contracts));
        localStorage.setItem('services', JSON.stringify(services));

        localStorage.setItem('nextClientId', nextClientId);
        localStorage.setItem('nextProviderId', nextProviderId);
        localStorage.setItem('nextContractId', nextContractId);
        localStorage.setItem('nextServiceId', nextServiceId);
    }

    function showSection(sectionId) {
        sections.forEach(section => section.classList.add('hidden'));
        document.getElementById(sectionId).classList.remove('hidden');

        navLinks.forEach(link => link.classList.remove('active'));
        const targetLink = document.querySelector(`[data-section="${sectionId.replace('-section', '')}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
            currentSectionTitle.textContent = targetLink.textContent;
        }

        // Mostrar/ocultar botón "Agregar Nuevo" según la sección
        if (sectionId === 'clients-section' || sectionId === 'providers-section' || sectionId === 'contracts-section' || sectionId === 'services-section') {
            addItemButton.classList.remove('hidden');
        } else {
            addItemButton.classList.add('hidden');
        }
    }

    function showModal(modalElement) {
        modalElement.classList.add('visible');
    }

    function hideModal(modalElement) {
        modalElement.classList.remove('visible');
        resetForm(modalElement);
    }

    function resetForm(modalElement) {
        const inputs = modalElement.querySelectorAll('input:not([type="hidden"]), select');
        inputs.forEach(input => {
            if (input.type === 'date') {
                input.value = '';
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });
        // Reset radio buttons if any
        const radioGroups = modalElement.querySelectorAll('.radio-group input[type="radio"]');
        radioGroups.forEach(radio => {
            if (radio.id === 'freq-monthly') radio.checked = true; // Default to monthly
        });
    }

    // --- Funciones de Login/Logout ---

    function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (USERS[username] && USERS[username] === password) {
            loginContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            showSection('dashboard-section'); // Muestra el dashboard por defecto
            updateDashboard();
            updateNotifications();
            localStorage.setItem('isLoggedIn', 'true'); // Guardar estado de login
        } else {
            loginMessage.textContent = 'Usuario o contraseña incorrectos.';
        }
    }

    function handleLogout() {
        mainContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
        loginMessage.textContent = '';
        localStorage.removeItem('isLoggedIn'); // Remover estado de login
    }

    // --- Funciones del Dashboard ---

    function updateDashboard() {
        document.getElementById('total-clients').textContent = clients.length;
        document.getElementById('active-services').textContent = contracts.filter(c => getContractStatus(c) === 'active').length;

        // Calcular ingresos totales estimados (sumando montos de contratos)
        let totalIncome = contracts.reduce((sum, contract) => sum + parseFloat(contract.amount || 0), 0);
        document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;

        // Calcular capital total (podría ser una estimación más compleja, aquí un ejemplo simple)
        // Por simplicidad, sumaremos ingresos menos egresos de proveedores anualizados
        let totalProviderCost = providers.reduce((sum, p) => {
            let amount = parseFloat(p.totalAmount || 0);
            let frequency = p.paymentFrequency;
            if (frequency === 'Mensual') return sum + (amount * 12);
            if (frequency === 'Trimestral') return sum + (amount * 4);
            if (frequency === 'Semestral') return sum + (amount * 2);
            if (frequency === 'Anual') return sum + amount;
            return sum;
        }, 0);
        let totalCapital = totalIncome * 12 - totalProviderCost; // Estimación anual
        document.getElementById('total-capital').textContent = `$${totalCapital.toFixed(2)}`;

        updateRenewalCounts();
    }

    // --- Funciones de Clientes ---

    function renderClients(filter = '') {
        clientTableBody.innerHTML = '';
        const filteredClients = clients.filter(client =>
            client.name.toLowerCase().includes(filter.toLowerCase()) ||
            client.lastname.toLowerCase().includes(filter.toLowerCase()) ||
            client.phone.toLowerCase().includes(filter.toLowerCase())
        );

        filteredClients.forEach(client => {
            const row = clientTableBody.insertRow();
            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.lastname}</td>
                <td>${client.phone}</td>
                <td class="action-buttons">
                    <button class="edit" data-id="${client.id}" data-type="client"><i class="fas fa-edit"></i></button>
                    <button class="delete" data-id="${client.id}" data-type="client"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }

    function handleSaveClient() {
        const id = document.getElementById('client-id').value;
        const name = document.getElementById('client-name').value.trim();
        const lastname = document.getElementById('client-lastname').value.trim();
        const phone = document.getElementById('client-phone').value.trim();

        if (!name || !lastname || !phone) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        if (id) {
            // Editar cliente existente
            const clientIndex = clients.findIndex(c => c.id === parseInt(id));
            if (clientIndex !== -1) {
                clients[clientIndex] = { id: parseInt(id), name, lastname, phone };
            }
        } else {
            // Nuevo cliente
            clients.push({ id: nextClientId++, name, lastname, phone });
        }
        saveToLocalStorage();
        renderClients();
        hideModal(clientFormContainer);
        updateDashboard();
        populateContractClients(); // Actualizar lista de clientes en el formulario de contratos
    }

    function handleDeleteClient(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este cliente? Se eliminarán también sus contratos asociados.')) {
            clients = clients.filter(c => c.id !== id);
            contracts = contracts.filter(contract => contract.clientId !== id); // Eliminar contratos asociados
            saveToLocalStorage();
            renderClients();
            updateDashboard();
            populateContractClients();
        }
    }

    function handleEditClient(id) {
        const client = clients.find(c => c.id === id);
        if (client) {
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-lastname').value = client.lastname;
            document.getElementById('client-phone').value = client.phone;
            showModal(clientFormContainer);
        }
    }

    // --- Funciones de Proveedores ---

    // Rellenar selector de cuentas (1 a 1000)
    function populateProviderAccounts() {
        // Clear existing options first to prevent duplicates on re-render
        providerAccountsSelect.innerHTML = '';
        for (let i = 1; i <= 1000; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            providerAccountsSelect.appendChild(option);
        }
    }

    function calculateProviderTotalAmount() {
        const unitCost = parseFloat(providerUnitCostInput.value) || 0;
        const accounts = parseInt(providerAccountsSelect.value) || 0;
        providerTotalAmountInput.value = (unitCost * accounts).toFixed(2);
    }

    function renderProviders(filter = '') {
        providerTableBody.innerHTML = '';
        const filteredProviders = providers.filter(provider =>
            provider.name.toLowerCase().includes(filter.toLowerCase()) ||
            provider.service.toLowerCase().includes(filter.toLowerCase()) ||
            provider.phone.toLowerCase().includes(filter.toLowerCase())
        );

        filteredProviders.forEach(provider => {
            const row = providerTableBody.insertRow();
            row.innerHTML = `
                <td>${provider.name} ${provider.lastname}</td>
                <td>${provider.service} (${provider.accounts} cuentas)</td>
                <td>${provider.currency}${parseFloat(provider.totalAmount).toFixed(2)} (${provider.paymentFrequency})</td>
                <td>${provider.startDate}</td>
                <td>${provider.endDate}</td>
                <td class="action-buttons">
                    <button class="edit" data-id="${provider.id}" data-type="provider"><i class="fas fa-edit"></i></button>
                    <button class="delete" data-id="${provider.id}" data-type="provider"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }

    function handleSaveProvider() {
        const id = document.getElementById('provider-id').value;
        const name = document.getElementById('provider-name').value.trim();
        const lastname = document.getElementById('provider-lastname').value.trim();
        const phone = document.getElementById('provider-phone').value.trim();
        const service = document.getElementById('provider-service').value.trim();
        const unitCost = parseFloat(document.getElementById('provider-unit-cost').value);
        const accounts = parseInt(document.getElementById('provider-accounts').value);
        const totalAmount = parseFloat(document.getElementById('provider-total-amount').value);
        const startDate = document.getElementById('provider-start-date').value;
        const endDate = document.getElementById('provider-end-date').value;
        const paymentFrequency = document.querySelector('input[name="payment-frequency"]:checked').value;
        const paymentMethod = document.getElementById('provider-payment-method').value.trim();
        const currency = document.getElementById('provider-currency').value.trim();

        if (!name || !service || isNaN(unitCost) || isNaN(accounts) || !startDate || !endDate) {
            alert('Por favor, completa todos los campos requeridos.');
            return;
        }

        const providerData = {
            id: id ? parseInt(id) : nextProviderId++,
            name, lastname, phone, service, unitCost, accounts, totalAmount,
            startDate, endDate, paymentFrequency, paymentMethod, currency
        };

        if (id) {
            const providerIndex = providers.findIndex(p => p.id === parseInt(id));
            if (providerIndex !== -1) {
                providers[providerIndex] = providerData;
            }
        } else {
            providers.push(providerData);
        }
        saveToLocalStorage();
        renderProviders();
        hideModal(providerFormContainer);
        updateDashboard();
        populateContractProviders(); // Actualizar lista de proveedores en el formulario de contratos
        updateNotifications(); // Recalcular notificaciones
    }

    function handleDeleteProvider(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este proveedor? Se eliminarán también los contratos y servicios asociados a él.')) {
            providers = providers.filter(p => p.id !== id);
            contracts = contracts.filter(contract => contract.providerId !== id); // Eliminar contratos asociados
            // MODIFICADO: Ya no hay providerId en services, pero si quieres evitar que se muestren servicios de proveedores eliminados, podrías filtrar renderServices. Por ahora, los servicios son independientes.
            saveToLocalStorage();
            renderProviders();
            updateDashboard();
            populateContractProviders();
            updateNotifications();
        }
    }

    function handleEditProvider(id) {
        const provider = providers.find(p => p.id === id);
        if (provider) {
            document.getElementById('provider-id').value = provider.id;
            document.getElementById('provider-name').value = provider.name;
            document.getElementById('provider-lastname').value = provider.lastname;
            document.getElementById('provider-phone').value = provider.phone;
            document.getElementById('provider-service').value = provider.service;
            document.getElementById('provider-unit-cost').value = provider.unitCost;
            document.getElementById('provider-accounts').value = provider.accounts;
            document.getElementById('provider-total-amount').value = provider.totalAmount;
            document.getElementById('provider-start-date').value = provider.startDate;
            document.getElementById('provider-end-date').value = provider.endDate;
            document.querySelector(`input[name="payment-frequency"][value="${provider.paymentFrequency}"]`).checked = true;
            document.getElementById('provider-payment-method').value = provider.paymentMethod;
            document.getElementById('provider-currency').value = provider.currency;
            showModal(providerFormContainer);
        }
    }

    // --- Funciones de Contratos ---

    // Rellenar selectores de clientes y proveedores para el formulario de contratos
    function populateContractClients() {
        contractClientSelect.innerHTML = '<option value="">Selecciona un cliente</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.name} ${client.lastname}`;
            contractClientSelect.appendChild(option);
        });
    }

    function populateContractProviders() {
        contractProviderSelect.innerHTML = '<option value="">Selecciona un proveedor</option>';
        providers.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.id;
            option.textContent = `${provider.name} (${provider.service})`;
            contractProviderSelect.appendChild(option);
        });
    }

    // NUEVO: Rellenar selector de servicios en el formulario de contratos
    function populateContractServices() {
        contractServiceSelect.innerHTML = '<option value="">Selecciona un servicio</option>';
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            contractServiceSelect.appendChild(option);
        });
    }

    function getContractStatus(contract) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Para comparar solo fechas
        const endDate = new Date(contract.endDate);
        endDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
            return 'expired'; // Vencido
        } else if (daysDiff <= 30) {
            return 'upcoming'; // Próximo a vencer (en 30 días o menos)
        } else {
            return 'active'; // Activo
        }
    }

    function renderContracts(filterText = '', statusFilter = '') {
        contractTableBody.innerHTML = '';
        const filteredContracts = contracts.filter(contract => {
            const client = clients.find(c => c.id === contract.clientId);
            const provider = providers.find(p => p.id === contract.providerId);
            // MODIFICADO: Obtener el nombre del servicio desde la lista de servicios
            const serviceObj = services.find(s => s.id === contract.serviceId);
            const serviceName = serviceObj ? serviceObj.name : 'Servicio Desconocido';

            const clientName = client ? `${client.name} ${client.lastname}` : 'N/A';
            const providerName = provider ? `${provider.name} (${provider.service})` : 'N/A';
            const contractStatus = getContractStatus(contract);

            const textMatch = filterText === '' ||
                clientName.toLowerCase().includes(filterText.toLowerCase()) ||
                serviceName.toLowerCase().includes(filterText.toLowerCase()) || // MODIFICADO
                providerName.toLowerCase().includes(filterText.toLowerCase()) ||
                contract.paymentMethodClient.toLowerCase().includes(filterText.toLowerCase());

            const statusMatch = statusFilter === '' || contractStatus === statusFilter;

            return textMatch && statusMatch;
        });

        filteredContracts.forEach(contract => {
            const client = clients.find(c => c.id === contract.clientId);
            const provider = providers.find(p => p.id === contract.providerId);
            // MODIFICADO: Obtener el nombre del servicio para mostrar
            const serviceObj = services.find(s => s.id === contract.serviceId);
            const serviceName = serviceObj ? serviceObj.name : 'Servicio Desconocido';

            const clientName = client ? `${client.name} ${client.lastname}` : 'N/A';
            const providerName = provider ? `${provider.name} (${provider.service})` : 'N/A';
            const status = getContractStatus(contract);
            let statusClass = '';
            let statusText = '';

            if (status === 'active') {
                statusClass = 'status-active';
                statusText = 'Activo';
            } else if (status === 'upcoming') {
                statusClass = 'status-upcoming';
                statusText = 'Próx. Vencer';
            } else if (status === 'expired') {
                statusClass = 'status-expired';
                statusText = 'Vencido';
            }

            const row = contractTableBody.insertRow();
            row.innerHTML = `
                <td>${clientName}</td>
                <td>${serviceName}</td> <td>$${parseFloat(contract.amount).toFixed(2)}</td>
                <td>${providerName}</td>
                <td>${contract.startDate}</td>
                <td>${contract.endDate}</td>
                <td>${contract.paymentMethodClient}</td>
                <td><span class="status-indicator ${statusClass}"></span>${statusText}</td>
                <td class="action-buttons">
                    <button class="edit" data-id="${contract.id}" data-type="contract"><i class="fas fa-edit"></i></button>
                    <button class="delete" data-id="${contract.id}" data-type="contract"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }

    function handleSaveContract() {
        const id = document.getElementById('contract-id').value;
        const clientId = parseInt(document.getElementById('contract-client').value);
        // MODIFICADO: Ahora obtenemos el ID del servicio del select
        const serviceId = parseInt(document.getElementById('contract-service').value);
        const amount = parseFloat(document.getElementById('contract-amount').value);
        const providerId = parseInt(document.getElementById('contract-provider').value);
        const startDate = document.getElementById('contract-start-date').value;
        const endDate = document.getElementById('contract-end-date').value;
        const paymentMethodClient = document.getElementById('contract-payment-method-client').value.trim();

        // Validar que se haya seleccionado un servicio
        if (!clientId || isNaN(serviceId) || serviceId === 0 || isNaN(amount) || !providerId || !startDate || !endDate || !paymentMethodClient) { // MODIFICADO
            alert('Por favor, completa todos los campos del contrato.');
            return;
        }

        const contractData = {
            id: id ? parseInt(id) : nextContractId++,
            clientId, serviceId, amount, providerId, startDate, endDate, paymentMethodClient // MODIFICADO: serviceId en vez de service
        };

        if (id) {
            const contractIndex = contracts.findIndex(c => c.id === parseInt(id));
            if (contractIndex !== -1) {
                contracts[contractIndex] = contractData;
            }
        } else {
            contracts.push(contractData);
        }
        saveToLocalStorage();
        renderContracts();
        hideModal(contractFormContainer);
        updateDashboard();
        updateNotifications(); // Recalcular notificaciones
    }

    function handleDeleteContract(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este contrato?')) {
            contracts = contracts.filter(c => c.id !== id);
            saveToLocalStorage();
            renderContracts();
            updateDashboard();
            updateNotifications();
        }
    }

    function handleEditContract(id) {
        const contract = contracts.find(c => c.id === id);
        if (contract) {
            document.getElementById('contract-id').value = contract.id;
            document.getElementById('contract-client').value = contract.clientId;
            // MODIFICADO: Seleccionar el servicio por ID
            document.getElementById('contract-service').value = contract.serviceId;
            document.getElementById('contract-amount').value = contract.amount;
            document.getElementById('contract-provider').value = contract.providerId;
            document.getElementById('contract-start-date').value = contract.startDate;
            document.getElementById('contract-end-date').value = contract.endDate;
            document.getElementById('contract-payment-method-client').value = contract.paymentMethodClient;
            populateContractClients(); // Asegurarse de rellenar selectores antes de mostrar
            populateContractProviders();
            populateContractServices(); // NUEVO: Rellenar select de servicios
            showModal(contractFormContainer);
        }
    }

    // --- Funciones de Servicios ---

    // ELIMINADO: populateServiceProvider ya no es necesario para el formulario de servicios
    // function populateServiceProvider() { ... }

    function renderServices(filter = '') {
        serviceTableBody.innerHTML = '';
        const filteredServices = services.filter(service => {
            // MODIFICADO: Ahora solo filtra por el nombre del servicio
            return service.name.toLowerCase().includes(filter.toLowerCase());
        });

        filteredServices.forEach(service => {
            const row = serviceTableBody.insertRow();
            row.innerHTML = `
                <td>${service.name}</td>
                <td class="action-buttons">
                    <button class="edit" data-id="${service.id}" data-type="service"><i class="fas fa-edit"></i></button>
                    <button class="delete" data-id="${service.id}" data-type="service"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }

    function handleSaveService() {
        const id = document.getElementById('service-id').value;
        const name = document.getElementById('service-name').value.trim();

        if (!name) { // MODIFICADO: Solo valida el nombre
            alert('Por favor, ingresa el nombre del servicio.');
            return;
        }

        const serviceData = {
            id: id ? parseInt(id) : nextServiceId++,
            name // MODIFICADO: Solo guarda el nombre
        };

        if (id) {
            const serviceIndex = services.findIndex(s => s.id === parseInt(id));
            if (serviceIndex !== -1) {
                services[serviceIndex] = serviceData;
            }
        } else {
            services.push(serviceData);
        }
        saveToLocalStorage();
        renderServices();
        hideModal(serviceFormContainer);
        populateContractServices(); // NUEVO: Actualizar el select de servicios en contratos
    }

    function handleDeleteService(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este servicio? Se eliminará de la lista de selección de contratos.')) {
            services = services.filter(s => s.id !== id);
            // Consideración: ¿Qué pasa con los contratos que usaban este servicio?
            // Por ahora, se mantendrán con el serviceId original, pero el renderizado
            // mostrará "Servicio Desconocido" si el servicio ya no existe.
            saveToLocalStorage();
            renderServices();
            populateContractServices(); // NUEVO: Actualizar el select de servicios en contratos
        }
    }

    function handleEditService(id) {
        const service = services.find(s => s.id === id);
        if (service) {
            document.getElementById('service-id').value = service.id;
            document.getElementById('service-name').value = service.name;
            showModal(serviceFormContainer);
        }
    }


    // --- Notificaciones ---

    function updateRenewalCounts() {
        let upcoming = 0;
        let today = 0;
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        // Reset hours for accurate date comparison
        now.setHours(0, 0, 0, 0);
        sevenDaysFromNow.setHours(0, 0, 0, 0);

        const allItems = [...contracts, ...providers]; // Incluir contratos y proveedores para notificaciones
        allItems.forEach(item => {
            const endDate = new Date(item.endDate);
            endDate.setHours(0, 0, 0, 0);

            if (endDate.getTime() === now.getTime()) {
                today++;
            } else if (endDate.getTime() > now.getTime() && endDate.getTime() <= sevenDaysFromNow.getTime()) {
                upcoming++;
            }
        });
        document.getElementById('upcoming-renewals').textContent = upcoming;
        document.getElementById('today-renewals').textContent = today;
    }


    function updateNotifications() {
        notificationsList.innerHTML = '';
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        // Reset hours for accurate date comparison
        now.setHours(0, 0, 0, 0);
        sevenDaysFromNow.setHours(0, 0, 0, 0);

        let hasNotifications = false;

        // Notificaciones para contratos con clientes
        contracts.forEach(contract => {
            const endDate = new Date(contract.endDate);
            endDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

            if (endDate.getTime() === now.getTime()) {
                hasNotifications = true;
                const client = clients.find(c => c.id === contract.clientId);
                const serviceObj = services.find(s => s.id === contract.serviceId); // MODIFICADO
                const clientName = client ? `${client.name} ${client.lastname}` : 'Cliente Desconocido';
                const serviceName = serviceObj ? serviceObj.name : 'Servicio Desconocido'; // MODIFICADO

                notificationsList.innerHTML += `
                    <div class="notification-item urgent">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>¡Hoy es la renovación del contrato de <strong>${serviceName}</strong> con <strong>${clientName}</strong>!</p>
                        <span class="date">${contract.endDate}</span>
                    </div>
                `;
            } else if (daysDiff > 0 && daysDiff <= 7) {
                hasNotifications = true;
                const client = clients.find(c => c.id === contract.clientId);
                const serviceObj = services.find(s => s.id === contract.serviceId); // MODIFICADO
                const clientName = client ? `${client.name} ${client.lastname}` : 'Cliente Desconocido';
                const serviceName = serviceObj ? serviceObj.name : 'Servicio Desconocido'; // MODIFICADO

                notificationsList.innerHTML += `
                    <div class="notification-item warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>El contrato de <strong>${serviceName}</strong> con <strong>${clientName}</strong> vence en ${daysDiff} día(s).</p>
                        <span class="date">${contract.endDate}</span>
                    </div>
                `;
            }
        });

        // Notificaciones para contratos con proveedores
        providers.forEach(provider => {
            const endDate = new Date(provider.endDate);
            endDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

            if (endDate.getTime() === now.getTime()) {
                hasNotifications = true;
                notificationsList.innerHTML += `
                    <div class="notification-item urgent">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>¡Hoy es la renovación del servicio de <strong>${provider.service}</strong> con <strong>${provider.name} ${provider.lastname}</strong>!</p>
                        <span class="date">${provider.endDate}</span>
                    </div>
                `;
            } else if (daysDiff > 0 && daysDiff <= 7) {
                hasNotifications = true;
                notificationsList.innerHTML += `
                    <div class="notification-item warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>El servicio de <strong>${provider.service}</strong> con <strong>${provider.name} ${provider.lastname}</strong> vence en ${daysDiff} día(s).</p>
                        <span class="date">${provider.endDate}</span>
                    </div>
                `;
            }
        });


        if (!hasNotifications) {
            notificationsList.innerHTML = '<p class="no-notifications">No hay notificaciones pendientes.</p>';
        }
        updateRenewalCounts(); // Actualizar contadores del dashboard después de generar notificaciones
    }


    // --- Event Listeners ---

    loginButton.addEventListener('click', handleLogin);
    logoutButton.addEventListener('click', handleLogout);

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') passwordInput.focus();
    });
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.dataset.section;
            showSection(`${section}-section`);
            // Renderizar tablas al mostrar la sección correspondiente
            if (section === 'clients') renderClients(searchClients.value);
            if (section === 'providers') renderProviders(searchProviders.value);
            if (section === 'contracts') renderContracts(searchContracts.value, filterContractsStatus.value);
            if (section === 'services') renderServices(searchServices.value);
            if (section === 'notifications') updateNotifications();
            updateDashboard(); // Siempre actualiza el dashboard
        });
    });

    // Event listener para el botón "Agregar Nuevo"
    addItemButton.addEventListener('click', () => {
        const currentSection = document.querySelector('.content section:not(.hidden)').id;
        // Reiniciar todos los formularios antes de abrir uno nuevo
        resetForm(clientFormContainer);
        resetForm(providerFormContainer);
        resetForm(contractFormContainer);
        resetForm(serviceFormContainer);

        if (currentSection === 'clients-section') {
            document.getElementById('client-id').value = ''; // Asegurarse de que sea un nuevo registro
            showModal(clientFormContainer);
        } else if (currentSection === 'providers-section') {
            document.getElementById('provider-id').value = ''; // Asegurarse de que sea un nuevo registro
            populateProviderAccounts(); // Asegúrate de rellenar las cuentas cada vez que se abre el modal
            calculateProviderTotalAmount(); // Recalcula el monto inicial
            showModal(providerFormContainer);
        } else if (currentSection === 'contracts-section') {
            document.getElementById('contract-id').value = ''; // Asegurarse de que sea un nuevo registro
            populateContractClients(); // Rellenar selectores de cliente
            populateContractProviders(); // Rellenar selectores de proveedor
            populateContractServices(); // NUEVO: Rellenar selector de servicios
            showModal(contractFormContainer);
        } else if (currentSection === 'services-section') {
            document.getElementById('service-id').value = ''; // Nuevo registro
            showModal(serviceFormContainer);
        }
    });


    exportDataButton.addEventListener('click', () => {
        const data = {
            clients: clients,
            providers: providers,
            contracts: contracts,
            services: services
        };
        const filename = 'gestion_contratos_data.json';
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Datos exportados con éxito como ' + filename);
    });

    // Eventos de Clientes
    saveClientButton.addEventListener('click', handleSaveClient);
    cancelClientButton.addEventListener('click', () => hideModal(clientFormContainer));
    clientTableBody.addEventListener('click', (e) => {
        if (e.target.closest('button')) {
            const button = e.target.closest('button');
            const id = parseInt(button.dataset.id);
            const type = button.dataset.type;

            if (type === 'client') {
                if (button.classList.contains('edit')) {
                    handleEditClient(id);
                } else if (button.classList.contains('delete')) {
                    handleDeleteClient(id);
                }
            }
        }
    });
    searchClients.addEventListener('input', (e) => renderClients(e.target.value));

    // Eventos de Proveedores
    populateProviderAccounts(); // Llama esto una vez al cargar la página para rellenar el selector
    providerUnitCostInput.addEventListener('input', calculateProviderTotalAmount);
    providerAccountsSelect.addEventListener('change', calculateProviderTotalAmount);
    saveProviderButton.addEventListener('click', handleSaveProvider);
    cancelProviderButton.addEventListener('click', () => hideModal(providerFormContainer));
    providerTableBody.addEventListener('click', (e) => {
        if (e.target.closest('button')) {
            const button = e.target.closest('button');
            const id = parseInt(button.dataset.id);
            const type = button.dataset.type;

            if (type === 'provider') {
                if (button.classList.contains('edit')) {
                    handleEditProvider(id);
                } else if (button.classList.contains('delete')) {
                    handleDeleteProvider(id);
                }
            }
        }
    });
    searchProviders.addEventListener('input', (e) => renderProviders(e.target.value));


    // Eventos de Contratos
    saveContractButton.addEventListener('click', handleSaveContract);
    cancelContractButton.addEventListener('click', () => hideModal(contractFormContainer));
    contractTableBody.addEventListener('click', (e) => {
        if (e.target.closest('button')) {
            const button = e.target.closest('button');
            const id = parseInt(button.dataset.id);
            const type = button.dataset.type;

            if (type === 'contract') {
                if (button.classList.contains('edit')) {
                    handleEditContract(id);
                } else if (button.classList.contains('delete')) {
                    handleDeleteContract(id);
                }
            }
        }
    });
    searchContracts.addEventListener('input', () => renderContracts(searchContracts.value, filterContractsStatus.value));
    filterContractsStatus.addEventListener('change', () => renderContracts(searchContracts.value, filterContractsStatus.value));

    // Eventos de Servicios
    saveServiceButton.addEventListener('click', handleSaveService);
    cancelServiceButton.addEventListener('click', () => hideModal(serviceFormContainer));
    serviceTableBody.addEventListener('click', (e) => {
        if (e.target.closest('button')) {
            const button = e.target.closest('button');
            const id = parseInt(button.dataset.id);
            const type = button.dataset.type;

            if (type === 'service') {
                if (button.classList.contains('edit')) {
                    handleEditService(id);
                } else if (button.classList.contains('delete')) {
                    handleDeleteService(id);
                }
            }
        }
    });
    searchServices.addEventListener('input', (e) => renderServices(e.target.value));

    // Inicializar la aplicación
    // Si ya hay una sesión iniciada (ej. por refresh), carga la interfaz principal
    if (localStorage.getItem('isLoggedIn') === 'true') {
        loginContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        showSection('dashboard-section');
        updateDashboard();
        updateNotifications();
        renderServices(); // Renderiza servicios al iniciar
        populateContractServices(); // Asegurarse de que el selector de servicios esté lleno
    } else {
        loginContainer.classList.remove('hidden');
        mainContainer.classList.add('hidden');
    }
});