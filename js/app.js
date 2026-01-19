let tg = window.Telegram.WebApp;
tg.expand();

// 🔥 ВАЖНО: Пока ты на локалке, оставляем localhost. 
// Когда переедем на сервер, заменим на реальный IP (например: http://95.123.45.67:8080/api/products)
const API_URL = 'http://localhost:8080/api/products'; 

let cart = [];

// 1. ЗАГРУЗКА ТОВАРОВ ИЗ БАЗЫ LIDHUB (Через API бота)
async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<p style="text-align:center; color: var(--tg-theme-hint-color);">Синхронизация с базой Lidhub...</p>';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Ошибка связи с API');
        
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Ошибка:', error);
        container.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <p>⚠️ Витрина временно недоступна.</p>
                <p style="font-size: 10px; color: var(--tg-theme-hint-color);">(Проверьте, запущен ли бот в Docker на порту 8080)</p>
            </div>
        `;
    }
}

// 2. ОТРИСОВКА КАРТОЧЕК (Генерируются динамически)
function renderProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center;">В базе пока нет активных товаров 😔</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">${product.price.toLocaleString()} сум</div>
            <button class="add-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                В корзину
            </button>
        `;
        container.appendChild(card);
    });
}

// 3. ЛОГИКА КОРЗИНЫ
window.addToCart = function(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateMainButton();
};

// 4. КНОПКА ТЕЛЕГРАМ (ОФОРМИТЬ)
function updateMainButton() {
    if (cart.length > 0) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        tg.MainButton.text = `Оформить заказ: ${total.toLocaleString()} сум`;
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

// 5. ОТПРАВКА ДАННЫХ В БОТ (НОРМАЛИЗАЦИЯ)
Telegram.WebApp.onEvent('mainButtonClicked', function(){
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsSummary = cart.map(i => `${i.name} x${i.quantity}`).join(', ');

    // Эти данные поймает shop_mode.py
    const orderData = {
        action: 'shop_order',
        items_text: itemsSummary,    // Для быстрого просмотра и Google Sheets
        total: total,                // Для итогов
        cart_details: cart           // 🔥 Для нормализованной таблицы OrderItems
    };

    tg.sendData(JSON.stringify(orderData));
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', loadProducts);
