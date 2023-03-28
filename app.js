
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.MAIN_SERVER_PORT;

app.use(express.json());
app.use(express.urlencoded( {extended: false} ));
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`server running on port ${port}`);
})


app.use((req, res) => {
    console.log(`404: ${req.path}`);
    res.status(404).json('page not found');
})
