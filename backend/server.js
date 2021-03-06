const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

// File reader
const fs = require("fs");
app.use(express.json());

// Server running on port 1234
const PORT = process.env.PORT || 1234;

// Method to read files with options : utf-8 or other encoding
const readFile = (fileName, option) => {
    return new Promise(function(resolve, reject) {
        fs.readFile(fileName, option, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });

    });
};

// Method to write file with data that needs to be stringified with JSON.stringify()
const writeFile = (fileName, data) => {
    return new Promise(function(resolve, reject) {
        fs.writeFile(fileName, data, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });

    });
};

const quizListFile = "./datas/quizList.json"
const quizDatasFile = "./datas/quizDatas.json"
const quizScoreRate = "./datas/quizScoreRate.json"

// READ : GET the quiz list endpoint
app.get('/quiz-list', function (req, res) {
    readFile(quizListFile, "utf8").then((data) => {
        res.send(JSON.parse(data))
    }).catch((err) => {  
        res.send('Error', err)
    })   
})

// READ : GET the quiz details endpoint 
app.get('/quiz-details/:label', function (req, res) {    
    readFile(quizDatasFile, "utf8").then((data) => {
        const quizDatas = JSON.parse(data)
        const quiz = quizDatas.find((quizData) => 
            quizData.quizLabel === req.params.label
        )
        res.send(quiz)
    }).catch((err) => {
        res.send('Error', err)
    }) 
})

// CREATE : POST the quiz score to get assessment rate endpoint 
app.post('/quiz-score', function (req, res) {    
    readFile(quizScoreRate, "utf8").then((data) => {
        const quizScores = JSON.parse(data)
        const quizAssessementData = quizScores.find((quizScore) => 
            quizScore.scoreMin <= req.body.finalScore && quizScore.scoreMax >= req.body.finalScore
        )
        res.send(quizAssessementData)
    }).catch((err) => {
        res.send('Error', err)
    }) 
})

// N.B: Double call back un peu compliqué pour la création du quiz car j'ai séparé l'info principal des détails. 
// Cela aurait été plus simple de les avoir en un seul fichier json mais je n'ai plus le temps pour améliorer cette architecture.

// CREATE : POST create a quiz
app.post('/quiz/create', async function (req, res) { 
    // Quiz category
    const newQuizCategory = req.body.quizCategory
    // Quiz datas
    const newQuizDetails = req.body.quizDetails

    // Check if user has sent the two elements expected first
    if (newQuizCategory && newQuizDetails) {
        readFile(quizListFile, "utf8").then((data) => {
            const oldQuizList = JSON.parse(data)
            const newQuizList = [...oldQuizList, newQuizCategory]   
    
            // Create quiz details
            readFile(quizDatasFile, "utf8").then((data) => {
                const oldQuizDatas = JSON.parse(data)
                const newQuizDatas = [...oldQuizDatas, newQuizDetails]
                writeFile(quizListFile, JSON.stringify(newQuizList, null, 2))
                writeFile(quizDatasFile, JSON.stringify(newQuizDatas, null, 2))
                res.send({newQuizCategory : newQuizList, newQuizDetails: newQuizDatas})
            }).catch((err) => {
                res.send('Error', err)
            })
        }).catch((err) => {
            res.send('Error', err)
        })   
    } else {
        res.send('Désolé, vos données envoyées ne correspondent pas aux standards requis pour créer un quiz. Veuillez à envoyer un objet avec les 2 propriétés. : quizCategory et quizDetails')
    }
})

// DELETE : DELETE endpoint to delete a quiz
app.delete('/quiz/delete/:label', function (req, res) {   
    // Delete quiz category 
    readFile(quizListFile, "utf8").then((data) => {
        const quizList = JSON.parse(data)
        const newQuizList = quizList.filter((quiz) => 
            quiz.quizLabel !== req.params.label
        )
        // Delete quiz datas
        readFile(quizDatasFile, "utf8").then((data) => {
            const quizData = JSON.parse(data)
            const newQuizData = quizData.filter((quiz) => 
                quiz.quizLabel !== req.params.label
            )
            writeFile(quizListFile, JSON.stringify(newQuizList, null, 2))
            writeFile(quizDatasFile, JSON.stringify(newQuizData, null, 2))
            res.send(`Quiz ${req.params.label} deleted successfully !`)
        }).catch((err) => {
            res.send('Error', err)
        })
    }).catch((err) => {
        res.send('Error', err)
    })
})

// UPDATE : PUT endpoint to modify the name of the quiz
app.put('/quiz/changeName/:label', function (req, res) {
    const newName = req.body.name   
    readFile(quizDatasFile, "utf8").then((data) => {
        const quizData = JSON.parse(data)
        quizData.forEach((quiz) => {
            quiz.quizLabel === req.params.label ? quiz.quizName = newName : null
        })
        writeFile(quizDatasFile, JSON.stringify(quizData, null, 2))
        res.send('Quiz name has been changed successfully')
    }).catch((err) => {
        res.send('Error', err)
    })
})


// App listening on port chosen
app.listen(PORT, function () {
    console.log(`App listening on port ${ PORT }`)
})