/**
 * GraphQL Introspection to discover actual Upwork schema
 */

const admin = require('firebase-admin');
const path = require('path');
const API = require('@upwork/node-upwork-oauth2');
const Graphql = require('@upwork/node-upwork-oauth2/lib/routers/graphql').Graphql;

const serviceAccountPath = path.join(__dirname, '..', 'upwork-monitor-app-firebase-adminsdk.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function introspectSchema() {
  console.log('Loading tokens from Firestore...');

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

  console.log('Setting up access token...');
  await new Promise((resolve) => {
    api.setAccessToken((tokenPair) => {
      resolve(tokenPair);
    });
  });

  const graphql = new Graphql(api);

  // Introspection query to discover the MarketplaceJobPostingSearchResult type
  const introspectionQuery = `
    query {
      __type(name: "MarketplaceJobPostingSearchResult") {
        name
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `;

  console.log('\nRunning introspection query...\n');

  return new Promise((resolve, reject) => {
    const params = {
      query: introspectionQuery,
    };

    graphql.execute(params, (error, httpStatus, data) => {
      if (error) {
        console.error('Error:', error);
        reject(error);
      } else {
        console.log('Status:', httpStatus);
        console.log('\nAvailable fields in MarketplaceJobPostingSearchResult:\n');

        if (data && data.data && data.data.__type && data.data.__type.fields) {
          const fields = data.data.__type.fields;
          fields.forEach(field => {
            const typeName = field.type.name || (field.type.ofType && field.type.ofType.name) || 'Unknown';
            console.log(`  - ${field.name}: ${typeName}`);
          });
        } else {
          console.log('Full response:', JSON.stringify(data, null, 2));
        }

        resolve(data);
      }
    });
  });
}

introspectSchema()
  .then(() => {
    console.log('\n✅ Introspection complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Introspection failed:', error);
    process.exit(1);
  });
