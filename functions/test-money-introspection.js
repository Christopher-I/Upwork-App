/**
 * GraphQL Introspection for Money and Occupations types
 */

const admin = require('firebase-admin');
const path = require('path');
const API = require('@upwork/node-upwork-oauth2');
const Graphql = require('@upwork/node-upwork-oauth2/lib/routers/graphql').Graphql;

const serviceAccountPath = path.join(__dirname, '..', 'upwork-monitor-app-firebase-adminsdk.json');
const serviceAccount = require(serviceAccountPath);

// Check if already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function introspectTypes() {
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

  const introspectionQuery = `
    query {
      Money: __type(name: "Money") {
        name
        fields {
          name
          type {
            name
            kind
          }
        }
      }
      Occupations: __type(name: "MarketplaceJobPostingSearchOccupations") {
        name
        fields {
          name
          type {
            name
            kind
            ofType {
              name
            }
          }
        }
      }
      Location: __type(name: "MarketPlaceJobSearchLocation") {
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

        if (data && data.data) {
          console.log('\n=== Money Type ===');
          if (data.data.Money && data.data.Money.fields) {
            data.data.Money.fields.forEach(field => {
              console.log(`  - ${field.name}: ${field.type.name || field.type.kind}`);
            });
          }

          console.log('\n=== MarketplaceJobPostingSearchOccupations Type ===');
          if (data.data.Occupations && data.data.Occupations.fields) {
            data.data.Occupations.fields.forEach(field => {
              const typeName = field.type.name || (field.type.ofType && field.type.ofType.name) || field.type.kind;
              console.log(`  - ${field.name}: ${typeName}`);
            });
          }

          console.log('\n=== MarketPlaceJobSearchLocation Type ===');
          if (data.data.Location && data.data.Location.fields) {
            data.data.Location.fields.forEach(field => {
              console.log(`  - ${field.name}: ${field.type.name || field.type.kind}`);
            });
          }
        } else {
          console.log('Full response:', JSON.stringify(data, null, 2));
        }

        resolve(data);
      }
    });
  });
}

introspectTypes()
  .then(() => {
    console.log('\n✅ Type introspection complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Type introspection failed:', error);
    process.exit(1);
  });
