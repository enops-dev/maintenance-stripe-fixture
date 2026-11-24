# maintenance-stripe-fixture

A tiny Express API used as a fixture for Enops Maintenance tests.

It pins old dependencies (stripe 14.2.0, jsonwebtoken 8.5.1, express 4.18.2,
lodash 4.17.20, axios 1.6.0) and uses legacy Stripe APIs (Charges, Sources,
customers.createSource) so a maintenance tool can find breaking changes and
deprecations and fix them.

Plain CommonJS, no build step, Node >= 20. Run `npm test` (no network needed).
