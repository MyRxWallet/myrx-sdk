'use strict';

const { API_BASE } = require('./constants');

/**
 * MyRxHealthClient — FHIR R4 + MyRxWallet EHR API client.
 *
 * All endpoints require a Bearer token (obtained via SMART on FHIR OAuth 2.0 + PKCE).
 * Standards: HL7 FHIR R4, US Core 6.1.0, SMART App Launch 2.0.0.
 * Live: https://ehr.myrxwallet.io/api/v1/fhir/r4/metadata
 */
class MyRxHealthClient {
  /**
   * @param {string} bearerToken   JWT from SMART auth flow
   * @param {string} [baseUrl]     API base (default: production)
   */
  constructor(bearerToken, baseUrl = API_BASE) {
    this.token = bearerToken;
    this.base = baseUrl.replace(/\/$/, '');
  }

  _headers() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
    };
  }

  async _get(path) {
    const res = await fetch(`${this.base}${path}`, { headers: this._headers() });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} — GET ${path}`);
    return res.json();
  }

  async _post(path, body) {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} — POST ${path}: ${text}`);
    }
    return res.json();
  }

  // ── FHIR Capability Statement ────────────────────────────────────────────

  /** Get FHIR R4 CapabilityStatement (no auth required). */
  static async getCapabilityStatement(baseUrl = API_BASE) {
    const res = await fetch(`${baseUrl}/fhir/r4/metadata`, {
      headers: { 'Accept': 'application/fhir+json' },
    });
    return res.json();
  }

  /** Get SMART configuration (no auth required). */
  static async getSmartConfig(baseUrl = 'https://ehr.myrxwallet.io') {
    const res = await fetch(`${baseUrl}/.well-known/smart-configuration`);
    return res.json();
  }

  // ── Patient ──────────────────────────────────────────────────────────────

  /** Get FHIR Patient resource. */
  async getPatient(patientId) {
    return this._get(`/fhir/r4/Patient/${patientId}`);
  }

  // ── Medications ──────────────────────────────────────────────────────────

  /** List MedicationRequest resources for a patient. */
  async getMedications(patientId) {
    return this._get(`/fhir/r4/MedicationRequest?patient=${patientId}`);
  }

  // ── Conditions ───────────────────────────────────────────────────────────

  /** List Condition resources (diagnoses) for a patient. */
  async getConditions(patientId) {
    return this._get(`/fhir/r4/Condition?patient=${patientId}`);
  }

  // ── Observations / Vitals ────────────────────────────────────────────────

  /** List Observation resources (vitals, labs) for a patient. */
  async getObservations(patientId, category = null) {
    const cat = category ? `&category=${category}` : '';
    return this._get(`/fhir/r4/Observation?patient=${patientId}${cat}`);
  }

  // ── Appointments ─────────────────────────────────────────────────────────

  /** Get patient appointments. */
  async getAppointments(patientId) {
    return this._get(`/appointments/my/${patientId}`);
  }

  /** Book an appointment. */
  async bookAppointment(body) {
    return this._post('/appointments/book', body);
  }

  // ── NFT Assets ───────────────────────────────────────────────────────────

  /** Get all NFTs owned by a patient (prescription, lab, insurance, etc.). */
  async getNFTs(patientId) {
    return this._get(`/nft/patient/${patientId}`);
  }

  /** Get MRT wallet balance and recent transactions. */
  async getMRTBalance(patientId) {
    const [balance, txs] = await Promise.all([
      this._get(`/gas/balance/${patientId}`),
      this._get(`/gas/transactions/${patientId}`),
    ]);
    return { ...balance, transactions: txs };
  }

  // ── MyRx Score ───────────────────────────────────────────────────────────

  /** Get patient's MyRx Health Score (300–850 scale). */
  async getMyRxScore(patientId) {
    return this._get(`/score/patient/${patientId}`);
  }

  // ── Prescription NFTs ────────────────────────────────────────────────────

  /** Get all prescription NFTs for a patient. Token format: RX-{SHA256_12}. */
  async getPrescriptionNFTs(patientId) {
    return this._get(`/rx/patient/${patientId}`);
  }

  // ── Lab NFTs ─────────────────────────────────────────────────────────────

  /** Get lab result NFTs for a patient. Token format: LAB-{PID6}-{SEQ6}. */
  async getLabNFTs(patientId) {
    return this._get(`/lab/my-orders`);
  }

  // ── Consent ──────────────────────────────────────────────────────────────

  /** Get consent grants and audit trail for a patient. */
  async getConsentAudit(patientId) {
    return this._get(`/consent/audit/${patientId}`);
  }

  /** Get a shareable health summary card. */
  async getHealthCard(patientId) {
    return this._get(`/mycard/${patientId}`);
  }

  // ── SMART Auth helpers ───────────────────────────────────────────────────

  /**
   * Build the SMART authorization URL (PKCE flow).
   * @param {object} opts
   * @param {string} opts.clientId
   * @param {string} opts.redirectUri
   * @param {string} opts.codeChallenge  SHA-256 of code_verifier, base64url-encoded
   * @param {string} [opts.scope]        default: 'patient/*.read openid fhirUser'
   * @param {string} [opts.state]
   */
  static buildAuthUrl(opts, baseUrl = 'https://ehr.myrxwallet.io') {
    const scope = opts.scope || 'patient/*.read openid fhirUser';
    const state = opts.state || Math.random().toString(36).slice(2);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: opts.clientId,
      redirect_uri: opts.redirectUri,
      scope,
      state,
      code_challenge: opts.codeChallenge,
      code_challenge_method: 'S256',
    });
    return `${baseUrl}/oauth/authorize?${params}`;
  }

  /**
   * Exchange authorization code for access token.
   * @param {object} opts
   * @param {string} opts.code
   * @param {string} opts.clientId
   * @param {string} opts.redirectUri
   * @param {string} opts.codeVerifier
   */
  static async exchangeCode(opts, baseUrl = 'https://ehr.myrxwallet.io') {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: opts.code,
      client_id: opts.clientId,
      redirect_uri: opts.redirectUri,
      code_verifier: opts.codeVerifier,
    });
    const res = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
    return res.json();
  }
}

module.exports = { MyRxHealthClient };
