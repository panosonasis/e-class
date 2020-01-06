const authenticService = require('../services/authentic.service');
var schema = require('../schema/loginValidationSchema.json');
var userSchema = require('../schema/userValidationSchema.json');
var iValidator = require('../../common/iValidator');
var errorCode = require('../../common/error-code');
var errorMessage = require('../../common/error-methods');
var mail = require('./../../common/mailer.js');
const pathFile = require('../../config/pathFile');
const jwt = require('jsonwebtoken');

function init(router) {
    router
        .route('/login')
        .get(indexPage)
        .post(loginWithAuth);
    router.route('/signup').post(signup);
}

const indexPage = (req, res) => {
    res.render(pathFile('/app/views/login.ejs'), {
        errorCredentials: '',
    });
};

const loginWithAuth = async (req, res) => {
    var authenticData = req.body;

    //Validating the input entity
    var json_format = iValidator.json_schema(schema.postSchema, authenticData, 'authentic');
    if (json_format.valid == false) {
        return res.status(422).send(json_format.errorMessage);
    }
    try {
        const data = await authenticService.authentic(authenticData);
        if (data) {
            const roleId = data[0].roleId;
            const username = data[0].username;
            const token = jwt.sign({ username }, 'my_secret_key', { expiresIn: 60 * 60 * 24 });
            res.cookie('token', token, {
                httpOnly: true,
                // secure: true // - for secure, https only cookie
            });

            switch (roleId) {
                case 1:
                    res.redirect('/api/dashboard/student');
                case 2:
                    res.redirect('/api/dashboard/teacher');
                default:
                    res.redirect('/api/dashboard/student');
            }
        }
    } catch (error) {
        res.render(pathFile('/app/views/login.ejs'), {
            errorCredentials: error.message,
        });
    }
};

const signup = async (req, res) => {
    var signUpData = req.body;

    //Validating the input entity
    var json_format = iValidator.json_schema(userSchema.signUpSchema, signUpData, 'signUpData');
    if (json_format.valid == false) {
        return res.status(422).send(json_format.errorMessage);
    }

    try {
        const data = await authenticService.signup(signUpData);
        if (data) {
            res.status(200).send('OK');
        }
    } catch (error) {
        res.status(444).send(error.message);
    }
};

module.exports.init = init;
