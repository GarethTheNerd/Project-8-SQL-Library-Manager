const Book = require('./models').Book;
const express = require('express');
const bodyParser = require('body-parser');
const HTTPPort = 3000; 
const Sequilize = require('sequelize');

function asyncHandler(cb){
    try {
        return async(req, res, next) => {
            await cb(req, res, next);
        }
    } catch(error) {
        throw error;
    }
}

const app = express();
app.set('view engine', 'pug');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', asyncHandler(async (req, res) => {
    res.redirect('/books/page/1');
}));

app.get('/books/', asyncHandler(async (req, res, next) => {
    res.redirect('/books/page/1');
}));

app.get('/books/page/:pageNum', asyncHandler(async (req, res, next) => {


    const itemsPerPage = 10;
    const pageNum = req.params.pageNum;

    const offset = (pageNum - 1) * itemsPerPage;

    const allBooks = await Book.findAll();
    const rowCount = allBooks.length;
    const totalPages = Math.ceil(rowCount / itemsPerPage);

    const books = await Book.findAll({
        offset: offset,
        limit: itemsPerPage
    });
    res.render('index', {books, totalPages, pageNum});
}));

app.get('/books/new', asyncHandler(async (req, res) => {
    const errors = [];
    res.render('new-book', {errors});
}));

app.post('/books/new', asyncHandler(async (req, res) => {
    
    const newBook = await Book.build({
        ...req.body
    });
    try {
        await newBook.save();
        res.redirect('/books/page/1');
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            res.render("new-book", {errors});
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

            const errors = [];
            res.render('update-book', {book, errors});
        
}));

app.post('/books/:id', asyncHandler(async (req, res) => {
    const book = await Book.findOne({
        where: {
            id: req.params.id
        }
    });
    
    if(book != null) {
        book.title = req.body.title;
        book.author = req.body.author;
        book.genre = req.body.genre;
        book.year = req.body.year;
    
        try {
            await book.save();
            res.redirect('/books/page/1');
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
                const errors = error.errors.map(err => err.message);
                console.log(req.body.book);
                res.render("update-book", {
                    errors,
                    book: {
                    title: req.body.title,
                    author: req.body.author,
                    genre: req.body.genre,
                    year: req.body.year
                }});
            } else {
                throw error;
            }
        }
    } else {
        throw new Error;
    }

    
}));

app.post('/books/:id/delete', asyncHandler(async (req, res) => {
    
    const book = await Book.findOne({
        where: {
            id: req.params.id
        }
    });

    await book.destroy();
    res.redirect('/books/page/1');
}));

app.post('/search', asyncHandler(async (req, res) => {
    
    const searchTerm = req.body.search;
    
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
    res.render('page-not-found');
});

app.use((err, req, res, next) => {
    res.status(500);
    res.render("error");
});

app.listen(HTTPPort, 
    () => {console.log(`App is running on port ${HTTPPort}`)}
    );