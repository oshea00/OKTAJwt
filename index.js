require('dotenv').config()
const express = require('express')
const app = express()

const port = process.env.PORT || 3030

app.get('/create', (req, res) => {
  const jwt = require('njwt')
  const claims = { iss: 'madeup-issuer', sub: 'MadeUpApp' }
  const token = jwt.create(claims, `${process.env.TOP_SECRET_PHRASE}`)
  token.setExpiration(new Date().getTime() + 60*1000)
  res.send(token.compact())
})

app.get('/verify/:token', (req, res) => {
    const jwt = require('njwt')
    const { token } = req.params
    jwt.verify(token, `${process.env.TOP_SECRET_PHRASE}`, (err, verifiedJwt) => {
      if(err){
        res.send(err.message)
      }else{
        res.send(verifiedJwt)
      }
    })
})

const session = require('express-session')
const { ExpressOIDC } = require('@okta/oidc-middleware')

app.use(session({
  secret: process.env.APP_SECRET,
  resave: true,
  saveUninitialized: false
}))

const oidc = new ExpressOIDC({
  issuer: `${process.env.OKTA_ORG_URL}/oauth2/default`,
  client_id: process.env.OKTA_CLIENT_ID,
  client_secret: process.env.OKTA_CLIENT_SECRET,
  redirect_uri: `${process.env.HOST_URL}/authorization-code/callback`,
  scope: 'openid profile'
})

app.use(oidc.router)

app.get('/', oidc.ensureAuthenticated(), (req, res) => res.send('Yay!! Authenticated with OKTA'))

app.listen(port, () => console.log(`JWT server listening on port ${port}!`))

