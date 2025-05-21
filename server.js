const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const { parse } = require('json2csv');
const app = express();

app.use(express.json());
app.use(express.static('public'));


const CSV_PATH = 'db.csv';

// 🔁 Route pour incrémenter un PlayCount
app.post('/increment', (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Titre manquant.' });
    }

    let data = [];

    // Lire le CSV
    fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
            data.push(row);
        })
        .on('end', () => {
            let found = false;

            // Mettre à jour la bonne ligne
            data = data.map((row) => {
                if (row.Title === title) {
                    found = true;
                    row.PlayCount = parseInt(row.PlayCount || '0', 10) + 1;
                }
                return row;
            });

            if (!found) {
                return res.status(404).json({ error: 'Chanson non trouvée.' });
            }

            // Réécrire le CSV
            const updatedCsv = parse(data, { fields: Object.keys(data[0]) });
            fs.writeFile(CSV_PATH, updatedCsv, (err) => {
                if (err) return res.status(500).json({ error: 'Erreur lors de l\'écriture du CSV.' });
                return res.json({ message: `PlayCount incrémenté pour "${title}".` });
            });
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
