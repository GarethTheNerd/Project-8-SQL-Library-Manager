const Book = require('./models').Book;
const express = require('express');
const bodyParser = require('body-parser');
const HTTPPort = 3000; 
const Sequilize = require('sequelize');

function asyncHandler(cb){
    return async(req, res, next) => {
        try {
            await cb(req, res, next)
        } catch(error){
        res.status(500).send(error);
        }
    }
}

const app = express();
app.set('view engine', 'pug');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', asyncHandler(async (req, res) => {
    res.redirect('/books');
}));

app.get('/books', asyncHandler(async (req, res) => {
    const books = await Book.findAll();
    res.render('all_books', {books});
}));

app.get('/books/new', asyncHandler(async (req, res) => {
    res.render('new_book');
}));

app.post('/books/new', asyncHandler(async (req, res) => {
    
    const newBook = await Book.build({
        ...req.body
    });
    try {
        await newBook.save();
        res.redirect('/books');
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            //We need to print errors here!
            console.error('Validation errors: ', errors);
        } else {
            throw error;
        }
    }
    
}));

app.get('/books/:id', asyncHandler(async (req, res) => {
    const book = await Book.findOne({
        where: {
            id: req.params.id
        }
    });
    res.render('book_detail', {book});
}));

app.post('/books/:id', asyncHandler(async (req, res) => {
    const book = await Book.findOne({
        where: {
            id: req.params.id
        }
    });
    
    book.title = req.body.title;
    book.author = req.body.author;
    book.genre = req.body.genre;
    book.year = req.body.year;

    await book.save();
    res.redirect('/books');
}));

app.post('/books/:id/delete', asyncHandler(async (req, res) => {
    
    const book = await Book.findOne({
        where: {
            id: req.params.id
        }
    });

    await book.destroy();
    res.redirect('/books');
}));

app.post('/search', asyncHandler(async (req, res) => {
    
    const searchTerm = req.body.search;
    console.log(`Search Term: ${searchTerm}`);
    
    const results = await Book.findAll({
        where: {
            [Sequilize.Op.or]: {
                title: {
                    [Sequilize.Op.like]: `%${searchTerm}%`
                },
                author: {
                    [Sequilize.Op.like]: `%${searchTerm}%`
                },
                genre: {
                    [Sequilize.Op.like]: `%${searchTerm}%`
                },
                year: {
                    [Sequilize.Op.like]: `%${searchTerm}%`
                }
            }
        }
            
    });
    
    res.render("search_results", {
        results,
        searchTerm
    })

}));

app.use(function (req, res, next) {
    res.status(404);
    res.render('not_found');
    next();
})

app.use((err, req, res, next) => {

    if (err.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => err.message);
        console.log(errors);
    } else {
        res.status(500);
        res.render("error");
    }
});

app.listen(HTTPPort, 
    () => {console.log(`App is running on port ${HTTPPort}`)}
    );