const { SeasonCardsDB , BestsellerItemsDB , ProductsDB } = require('../models/models');

const getCardInfo = async (req, res) => {
    const result = await fetchData(SeasonCardsDB, 4, req.query.page);

    res.status(200).json(result);
};

const getBestsellerItems = async (req, res) => {
    const result = await fetchData(BestsellerItemsDB, 4, req.query.page);

    res.status(200).json(result);
};

const getProducts = async (req, res) => {
    const result = await fetchData(ProductsDB,30, req.query.page);
    res.status(200).json(result);
   
};

const fetchData = async (db, limit, page) => {
    const offset = limit * ((parseInt(page) || 1) - 1);
    try {
        const { count, rows } = await db.findAndCountAll({
            limit,
            offset,
            order: [['id', 'ASC']],
        });
        return {
            result: rows,
            count,
            pages: Math.ceil(count / limit),
        };
    } catch (error) {
        console.error('Error fetching infos: ', error);
        return 'Internal Server Error';
    }
};


module.exports = {
    getCardInfo,
    getBestsellerItems,
    getProducts

}