let tg = window.Telegram.WebApp;
tg.expand(); // Раскрываем на весь экран

// Адаптация под тему пользователя
tg.setHeaderColor(getComputedStyle(document.body).getPropertyValue('--bg-color').trim());

// 🔥 ТВОЯ АКТУАЛЬНАЯ ССЫЛКА NGROK
const API_URL = 'https://tardiest-maye-scenographic.ngrok-free.dev/api/products'; 

// Корзина теперь хранит уникальные товары с количеством
let cart = []; 

// 1. Загрузка товаров с Бэкенда
async function loadProducts() {
    const container = document.getElementById('products-container');
    // Показываем лоадер или текст пока грузится
    if (container) {
        container.innerHTML = '<p style="text-align:center; margin-top: 20px; color: var(--text-color);">Загрузка витрины...</p>';
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Ошибка сети');
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error(error);
        if (container) {
            container.innerHTML = '<p style="text-align:center; margin-top: 20px; color: red;">⚠️ Ошибка связи с сервером.<br>Проверьте Ngrok.</p>';
        }
    }
}

// 2. Отрисовка товаров на экране
function renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = ''; // Очищаем

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-color);">Товаров пока нет.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Картинка: если ссылка кривая (file_id от телеграм), ставим заглушку, чтобы не было битого фото
        const imgSrc = (product.image && product.image.startsWith('http')) 
            ? product.image 
            : 'https://via.placeholder.com/150?text=Lidhub+Product';

        card.innerHTML = `
            <div class="image-container">
                <img src="${imgSrc}" alt="${product.name}">
            </div>
            <div class="card-info">
                <h3>${product.name}</h3>
                <p class="desc">${product.description || ''}</p>
                <div class="price">${product.price.toLocaleString()} сум</div>
                <button class="add-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                    В корзину
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. Добавление в корзину (Логика Quantity)
window.addToCart = function(id, name, price) {
    // Ищем, есть ли уже этот товар
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1; // Увеличиваем кол-во
    } else {
        cart.push({ id, name, price, quantity: 1 }); // Добавляем новый
    }

    // Виброотклик
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }

    updateMainButton();
};

// 4. Обновление Главной Кнопки
function updateMainButton() {
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (cart.length > 0) {
        tg.MainButton.setText(`ОФОРМИТЬ: ${totalPrice.toLocaleString()} сум`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

// 5. Отправка данных боту (Строго по формату shop_mode.py)
tg.onEvent('mainButtonClicked', function() {
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Красивый список для Google Sheets и сообщения: "Товар (x2), Товар2 (x1)"
    const itemsSummary = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');

    const dataToSend = JSON.stringify({
        action: "shop_order",
        items_text: itemsSummary,       // Ключ, который ждет shop_mode.py
        total: totalPrice,              // Ключ, который ждет shop_mode.py
        cart_details: cart              // Массив с {id, quantity} для базы данных
    });

    tg.sendData(dataToSend);
});

// Запускаем загрузку при старте
document.addEventListener('DOMContentLoaded', loadProducts);
