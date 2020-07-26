//These are our includes. They are other packages and our book model
const Book = require('./models').Book;
const express = require('express');
const bodyParser = require('body-parser');
const Sequilize = require('sequelize');
//We define the port up here for easy changing
const HTTPPort = 3000; 

function asyncHandler(cb){
    try {
        return async(req, res, next) => {
            await cb(req, res, next);
        }
    } catch(error) {
        throw error;
    }
}

//Define the app and set the view engine
const app = express();
app.set('view engine', 'pug');

//Setup our 'public' route and setup body parser for post routes
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

//This function handles the main route. We are just redirecting as we don't need a page here
app.get('/', asyncHandler(async (req, res) => {
    res.redirect('/books/page/1');
}));

//This function handles the /books route. We are just redirecting to page 1 as we have multiple pages and they haven't defined one
app.get('/books/', asyncHandler(async (req, res, next) => {
    res.redirect('/books/page/1');
}));

//This function handles /books/page/num so we work out which items to show and render them.
app.get('/books/page/:pageNum', asyncHandler(async (req, res, next) => {

    const itemsPerPage = 10; //Set items per page (so it can be changed)
    const pageNum = req.params.pageNum; //Get page number from URL

    const offset = (pageNum - 1) * itemsPerPage; //This is the offset to pass to the query. It is calculated based on the number of items per page

    const allBooks = await Book.findAll(); //We get all books to see how many there are.
    const rowCount = allBooks.length;
    const totalPages = Math.ceil(rowCount / itemsPerPage); //And we work out how many pages are needed.

    const books = await Book.findAll({ //And now we need to get the correct page contents.
        offset: offset,
        limit: itemsPerPage
    });
    res.render('index', {books, totalPages, pageNum}); //And render the page
}));

//This function handles the new route. We will just render the page with an empty errors object
app.get('/books/new', asyncHandler(async (req, res) => {
    const errors = [];
    res.render('new-book', {errors});
}));

//This route creates the new book that has been posted to us. If a validation error occurs, we re-render the page with errors
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
//This route shows a specific book
app.get('/books/:id', asyncHandler(async (req, res) => {

    try {
        const book = await Book.findOne({
            where: {
                id: req.params.id
            }
        });
        const errors = [];
    res.render('update-book', {book, errors});

    } catch(error) {
        error.status = 404;
        throw error;
    }

}));

//This route edits a book that has been posted to us. If a validation error occurs, we re-render the page with errors
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
        throw new Error();
    }

    
}));

//This route deletes the book posted to us
app.post('/books/:id/delete', asyncHandler(async (req, res) => {
    
    const book = await Book.findOne({
        where: {
            id: req.params.id
        }
    });

    await book.destroy();
    res.redirect('/books/page/1');
}));

//This route performs a search. We get the search term from the body of the request (posted)
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

//Page not found handler. We set the status and render the 404 page 
app.use(function (req, res, next) {
    res.status(404);
    res.render("page-not-found");
});

//Error handerler. We render a friendly page here
app.use(function (err, req, res, next) {
    res.status(500);
    res.render("error");
});

//Start the server using the port from the top of the file.
app.listen(HTTPPort, () => {console.log(`App is running on port ${HTTPPort}`)});