const emailTokensModel = require('../models/email-tokens');
const {sendMail} = require('./mailer');
const {FRONTEND_URL} = require('../config');

const ACTIONS = {
    verify_email: {
        subject: 'Verify your NyxIDE account',
        heading: 'Verify your email',
        buttonText: 'Verify Email',
        path: '/verify-email',
        body: user => `Hey ${user.username}, click below to verify this email address for your NyxIDE account.`
    },
    reset_password: {
        subject: 'Reset your NyxIDE password',
        heading: 'Reset your password',
        buttonText: 'Reset Password',
        path: '/reset-password',
        body: () => 'We got a request to reset your NyxIDE password. If this wasn\'t you, ignore this email.'
    },
    delete_account: {
        subject: 'Confirm deleting your NyxIDE account',
        heading: 'Confirm account deletion',
        buttonText: 'Continue to Delete Account',
        path: '/delete-account',
        body: user => `We got a request to permanently delete "${user.username}" and all of its projects. ` +
            'This can\'t be undone. If this wasn\'t you, ignore this email.'
    }
};

// The one place that actually builds a token + sends an account-action email - every route
// that triggers one of these (register, resend, forgot-password, delete-account) calls this,
// so the cooldown in email-tokens.create() is enforced no matter which of them is used.
const sendAccountEmail = async (user, type) => {
    if (!user.email) {
        throw new Error('This account has no email address on file.');
    }
    const action = ACTIONS[type];
    const token = emailTokensModel.create(user.id, type);
    await sendMail({
        to: user.email,
        subject: action.subject,
        heading: action.heading,
        bodyHtml: `<p>${action.body(user)}</p>`,
        buttonText: action.buttonText,
        buttonUrl: `${FRONTEND_URL}${action.path}?token=${token}`
    });
};

module.exports = {sendAccountEmail};
