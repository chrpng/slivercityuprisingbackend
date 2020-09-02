const express = require('express');
const nodemailer = require('nodemailer');
const emailExistence = require('email-existence');
const contactUsRouter = express.Router();

const transport = {
  host: 'smtp.gmail.com',
  auth: {
    user: process.env.CONTACT_USER,
    pass: process.env.CONTACT_PASS
  }
}

const transporter = nodemailer.createTransport(transport)

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take contact messages");
  }
})

contactUsRouter
  .route('/')
  .post((req, res, next) => {
    const name = req.body.name
    const email = req.body.email
    const message = req.body.message
    for (const field of [ 'name', 'email', 'message' ]){
      if (!req.body[field]) {
        return res.send({
          status: 'fail',
          error: `Missing '${field}'`
        });
      }
    }

    emailExistence.check(email, function(error, response) {
      if(error) {
        res.send({
          status: 'fail',
          error: 'Invalid email.'
        })
      }
    })
    
    const mailOpts = {
      from: '<Sender Email Placeholder>',
      to: process.env.TEST_EMAIL || 'info@silvercityuprising.org',
      subject: 'New Message from Contact Form',
      text: `${name} (${email}) says: ${message}`
    }

    const confirmMailOpts = {
      from: "<Sender Email Placeholder>",
      to: email,
      subject: "Submission was successful",
      text: `Thank you for contacting us!\n\nForm details\nName: ${name}\nEmail: ${email}\nMessage: ${message}`
    }

    transporter.sendMail(mailOpts, (err, info) => {
      if (err) {
        res.send({
          status: 'fail',
          error: 'Message failed to send.'
        })
      } else {
        transporter.sendMail(confirmMailOpts, (error, info) => {
          if(error) {
            res.send({
              status: 'fail',
              error: 'Confirmation email failed to send, but message may have been received.'
            })
          } else{
            res.send({
              status: 'success'
            })
          }
        });
      }
    })
  })

module.exports = contactUsRouter;