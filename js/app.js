// frontend/js/app.js
let tg = window.Telegram.WebApp;
tg.expand(); // Раскрываем на весь экран

// Адаптация под тему пользователя
tg.setHeaderColor(getComputedStyle(document.body).getPropertyValue('--bg-color').trim());

let cart = {
    items: [], // Храним объекты {name, price, id}
    totalPrice: 0
};

function addToCart(id, name, price) {
    // Добавляем товар
    cart.items.push({ id, name, price });
    cart.totalPrice += price;

    // Виброотклик (User Experience)
    tg.HapticFeedback.impactOccurred('medium');

    // Обновляем кнопку Telegram
    updateMainButton();
    
    // Визуальный эффект на кнопке товара (опционально можно добавить класс)
    console.log(`Added: ${name}`);
}

function updateMainButton() {
    if (cart.items.length > 0) {
        tg.MainButton.setText(`ОФОРМИТЬ: ${cart.totalPrice.toLocaleString()} сум`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

// Слушаем нажатие на ГЛАВНУЮ кнопку Telegram
tg.onEvent('mainButtonClicked', function(){
    // Формируем красивые данные для отправки боту
    // Превращаем массив товаров в строку для читабельности
    const itemsSummary = cart.items.map(i => i.name).join(', ');
    
    const dataToSend = JSON.stringify({
        action: "shop_order",
        items: itemsSummary,
        total: cart.totalPrice,
        raw_items: cart.items // Для будущего сохранения в БД по ID
    });

    tg.sendData(dataToSend);
});