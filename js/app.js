let tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor(getComputedStyle(document.body).getPropertyValue('--bg-color').trim());

// 🔥 ВСТАВЬ СЮДА СВОЮ ССЫЛКУ NGROK
const API_URL = 'https://tardiest-maye-scenographic.ngrok-free.dev/api/products'; 

let cart = []; 

// 1. Загрузка товаров (API)
async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<p style="text-align:center; margin-top: 20px;">Загрузка товаров...</p>';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Ошибка сети');
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align:center; margin-top: 20px;">⚠️ Ошибка загрузки витрины.<br>Проверьте подключение бота.</p>';
    }
}

// 2. Отрисовка
function renderProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Товаров пока нет.</p>';
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

// 3. Умная корзина (Складывает количество)
window.addToCart = function(id, name, price) {
    // Проверяем, есть ли уже такой товар
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1; // Если есть - увеличиваем счетчик
    } else {
        cart.push({ id, name, price, quantity: 1 }); // Если нет - добавляем новый
    }

    tg.HapticFeedback.impactOccurred('medium');
    updateMainButton();
};

// 4. Кнопка и Отправка
function updateMainButton() {
    if (cart.length > 0) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        tg.MainButton.setText(`ОФОРМИТЬ: ${total.toLocaleString()} сум`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

tg.onEvent('mainButtonClicked', function() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Красивый текст для Google Sheets
    const itemsSummary = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');

    const orderData = {
        action: "shop_order",
        items_text: itemsSummary,
        total: total,
        cart_details: cart // Передаем структуру {id, qty} для базы
    };

    tg.sendData(JSON.stringify(orderData));
});

document.addEventListener('DOMContentLoaded', loadProducts);
