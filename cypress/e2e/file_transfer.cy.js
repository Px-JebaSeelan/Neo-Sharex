/* eslint-env cypress */
/* global describe, it, cy */
// Basic E2E test for Neo Sharex file transfer UI

describe('Neo Sharex File Transfer Flow', () => {
  it('Loads the homepage and shows the title', () => {
    cy.visit('https://neo-sharex.web.app');
    cy.contains('Neo Sharex');
  });
  // Add more E2E steps as needed for your flows
});
