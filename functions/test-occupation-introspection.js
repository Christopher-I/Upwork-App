/**
 * GraphQL Introspection for Occupation type
 */

const admin = require('firebase-admin');
const path = require('path');
const API = require('@upwork/node-upwork-oauth2');
const Graphql = require('@upwork/node-upwork-oauth2/lib/routers/graphql').Graphql;

const serviceAccountPath = path.join(__dirname, '..', 'upwork-monitor-app-firebase-adminsdk.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function introspectOccupation() {
  const tokenDoc = await db.collection('config').doc('upwork_tokens').get();
  const storedTokens = tokenDoc.data();

  const config = {
    clientId: 'df88a3a8224d980f27d9fd04bc50e903',
    clientSecret: 'a0e2db88d2f328cd',
    redirectUri: 'https://seedapp.io',
    accessToken: storedTokens.access_token,
    refreshToken: storedTokens.refresh_token,
    expiresIn: storedTokens.expires_in,
    expiresAt: storedTokens.expires_at,
  };

  const api = new API(config);
  await new Promise((resolve) => {
    api.setAccessToken((tokenPair) => resolve(tokenPair));
  });

  const graphql = new Graphql(api);

  const introspectionQuery = `
    query {
      __type(name: "MarketplaceJobPostingSearchOccupation") {
        name
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
  `;

  return new Promise((resolve, reject) => {
    graphql.execute({ query: introspectionQuery }, (error, httpStatus, data) => {
      if (error) {
        reject(error);
      } else {
        console.log('=== MarketplaceJobPostingSearchOccupation Type ===');
        if (data && data.data && data.data.__type && data.data.__type.fields) {
          data.data.__type.fields.forEach(field => {
            console.log(`  - ${field.name}: ${field.type.name || field.type.kind}`);
          });
        }
        resolve(data);
      }
    });
  });
}

introspectOccupation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
