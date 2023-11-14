const { SeasonCardsDB , BestsellerItemsDB , ProductsDB } = require('../models/models');

const getCardInfo = async (req, res) => {
    const limit = 4; 
    let page = parseInt(req.query.page); // Liest den 'page'-Parameter aus der Query-String
    if (isNaN(page) || page < 1) {
        page = 1; // Standard auf Seite 1 setzen, falls 'page' nicht gültig ist
    }
    const offset = limit * (page - 1);

    try {
        const { count, rows } = await SeasonCardsDB.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['id', 'ASC']], // Aktualisierte Sortierungssyntax
        });

        res.status(200).json({
            result: rows,
            count: count,
            pages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching infos: ', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    getCardInfo
}