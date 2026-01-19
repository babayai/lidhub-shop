// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand(); [cite_start]// Раскрываем Mini App на весь экран [cite: 1]

// Настройка цвета заголовка под тему пользователя
tg.setHeaderColor(getComputedStyle(document.body).getPropertyValue('--bg-color').trim());

// 🔥 ССЫЛКА НА ТВОЙ API (NGROK ТУННЕЛЬ)
// При перезапуске ngrok эту ссылку нужно обновлять здесь
const API_URL = 'https://tardiest-maye-scenographic.ngrok-free.dev/api/products'; 

// Состояние корзины
let cart = []; 

// ==========================================
// 1. ЗАГРУЗКА ТОВАРОВ ИЗ БАЗЫ LIDHUB
// ==========================================
async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<p style="text-align:center; color: var(--tg-theme-hint-color);">Синхронизация с базой Lidhub...</p>';

    try {
        // Запрос к API боту
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Ошибка связи с сервером');
        
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        container.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <p>⚠️ Витрина временно недоступна.</p>
                <p style="font-size: 10px; color: var(--tg-theme-hint-color);">Проверьте статус туннеля Ngrok и работу Docker-контейнера.</p>
            </div>
        `;
    }
}

// ==========================================
// 2. ОТРИСОВКА КАРТОЧЕК ТОВАРОВ
// ==========================================
function renderProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center;">В базе пока нет товаров 😔</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${product.name}</h3>
            <p>${product.description || ''}</p>
            <div class="price">${product.price.toLocaleString()} сум</div>
            <button class="add-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                В корзину
            </button>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// 3. УПРАВЛЕНИЕ КОРЗИНОЙ
// ==========================================
window.addToCart = function(id, name, price) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Формируем объект для OrderItem в БД
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });
    }

    [cite_start]// UX: Виброотклик при добавлении [cite: 1]
    tg.HapticFeedback.impactOccurred('medium');
    
    updateMainButton();
    console.log(`Добавлено в корзину: ${name}`);
};

// ==========================================
// 4. ГЛАВНАЯ КНОПКА ТЕЛЕГРАМ
// ==========================================
function updateMainButton() {
    if (cart.length > 0) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        tg.MainButton.setText(`ОФОРМИТЬ: ${total.toLocaleString()} сум`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

// ==========================================
// 5. ОТПРАВКА ДАННЫХ В БОТ (API INTEGRATION)
// ==========================================
tg.onEvent('mainButtonClicked', function() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Формируем текстовое описание для Google Sheets
    const itemsSummary = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');

    // Структура данных, которую ожидает наш shop_mode.py
    const orderData = {
        action: "shop_order",
        items_text: itemsSummary,
        total: total,
        cart_details: cart // Полный массив для записи в таблицу order_items
    };

    // Отправляем данные в бот
    tg.sendData(JSON.stringify(orderData));
});

// Запуск загрузки товаров при открытии страницы
document.addEventListener('DOMContentLoaded', loadProducts);
