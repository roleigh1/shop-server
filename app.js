require('dotenv').config();
const express = require('express'); 
const cors = require('cors'); 
const router = require('./routes/apiRoutes');
const dataController = require('./routes/dataRoutes'); 
const app = express();

app.use(express.static('C:\\Users\\Robin\\OneDrive\\Desktop\\react\\shop\\public')); 
app.use(cors());
app.use(express.json());

app.use('/api', router); 

app.listen(3333, () => console.log('Running on port 3333'))