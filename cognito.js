const AWS = require('aws-sdk')
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const { CognitoJwtVerifier } = require('aws-jwt-verify')

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID
const IDENTITY_POLL_ID = process.env.AWS_COGNITO_IDENTITY_POLL_ID

AWS.config.region = process.env.AWS_REGION

const poolData = {
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
}

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: IDENTITY_POLL_ID,
})

async function registerUser(json) {
  const { username, email, password } = json

  let attributeList = []

  attributeList.push(
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: 'email',
      Value: email,
    })
  )

  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)

  return new Promise((resolve) => {
    userPool.signUp(
      username,
      password,
      attributeList,
      null,
      function (err, result) {
        if (err) {
          console.error('error', err)
          return resolve({ statusCode: 422, response: err })
        }

        return resolve({ result })
      }
    )
  })
}

function getCognitoUser(email) {
  const userData = {
    Username: email,
    Pool: new AmazonCognitoIdentity.CognitoUserPool(poolData),
  }

  return new AmazonCognitoIdentity.CognitoUser(userData)
}

function getAuthDetails(email, password) {
  var authenticationData = {
    Username: email,
    Password: password,
  }
  return new AmazonCognitoIdentity.AuthenticationDetails(authenticationData)
}

async function loginUser(json) {
  const { email, password } = json

  return new Promise((resolve) => {
    getCognitoUser(email).authenticateUser(getAuthDetails(email, password), {
      onSuccess: (result) => {
        const token = {
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        }

        return resolve({ token })
      },

      onFailure: (err) => {
        console.error('error: ', err)
        return resolve({ statusCode: 400, response: err })
      },
    })
  })
}

async function verifyUser(json) {
  const { token } = json

  return new Promise(async (resolve) => {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: USER_POOL_ID,
      tokenUse: 'access',
      clientId: CLIENT_ID,
    })

    try {
      const payload = await verifier.verify(token)
      console.log('Token is valid. Payload:', payload)

      return resolve({ payload })
    } catch (err) {
      console.log('Token not valid!')
      return resolve({ statusCode: 400, response: err })
    }
  })
}

module.exports = {
  registerUser,
  loginUser,
  verifyUser,
}
