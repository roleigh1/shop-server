require('dotenv').config();
const express = require('express'); 
const cors = require('cors'); 
const router = require('./routes/apiRoutes');

const app = express();

app.use(express.static('C:\\Users\\Robin\\OneDrive\\Desktop\\react\\shop\\public')); 
app.use(cors());
app.use(express.json());

app.use('/api', router); 

app.listen(4242, () => console.log('Running on port 4242'))