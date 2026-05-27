export interface TCTemplate {
  id: string;
  name: string;
  icon: string;
  expectedRisk: "Low" | "Medium" | "High" | "Critical";
  text: string;
}

export const templates: TCTemplate[] = [
  {
    id: "spotify",
    name: "Spotify (Terms of Service Snippet)",
    icon: "Music",
    expectedRisk: "Medium",
    text: `SPOTIFY TERMS OF SERVICE
Effective Date: February 15, 2024

1. Introduction
Welcome to Spotify. By signing up for a Spotify account, using the Service, or accessing any music, podcasts, videos, or other content (collectively, "Content"), you agree to these Terms.

2. Account Setup & Billable Transactions
To use the Spotify Service, you must register for an account. We offer Premium Subscriptions and Free Ad-Supported Services. 
BILLING POLICY: If you register for a Paid Subscription, you agree to pay Spotify the recurring monthly or annual subscription fees. 
AUTOMATIC RENEWAL: YOUR PAYMENT TO SPOTIFY WILL AUTOMATICALLY RENEW AT THE END OF THE SUBSCRIPTION PERIOD UNTIL AND UNLESS YOU CANCEL YOUR SUBSCRIPTION. You are solely responsible for canceling your subscription before the next renewal charge. All fees are non-refundable.

3. Content Ownership and Licenses
You retain copyright in any user content you upload to Spotify. However, by uploading content (including playlists, reviews, profile pictures, and messages), you grant Spotify a worldwide, perpetual, non-exclusive, royalty-free, transferable, sub-licensable license to use, reproduce, modify, make available, publish, translate, and distribute your User Content through any medium. This license survives even if you terminate your Spotify account.

4. Privacy and Data Sharing
We store your search queries, music playback lists, device identifiers, and location data to customize advertising networks. We may share anonymized or aggregated user trackers with advertising brokers, third-party sponsors, and affiliates.

5. Limitation of Liability and Arbitration
TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPOTIFY'S ENTIRE LIABILITY SHALL BE LIMITED TO THE TOTAL AMOUNT PAID BY THE USER IN THE PRECEDING TWELVE MONTHS.
MANDATORY INDIVIDUAL ARBITRATION: YOU AGREE THAT DISPUTES BETWEEN YOU AND SPOTIFY WILL BE RESOLVED BY BINDING, INDIVIDUAL ARBITRATION, AND YOU WAIVE YOUR RIGHT TO A TRIAL BY JURY OR TO PARTICIPATE IN ANY CLASS ACTION LAWSUIT.`
  },
  {
    id: "zoom",
    name: "Zoom (AI & Content Use Snippet)",
    icon: "Video",
    expectedRisk: "High",
    text: `ZOOM TERMS OF SERVICE
Effective Date: March 2024

Section 10. Customer Content and Licenses
"Customer Content" refers to all data, materials, files, audio, video, recordings, and text messages sent, uploaded, or transmitted during Zoom meetings.
You retain ownership of your Customer Content. However, by using Zoom, you grant us an active, perpetual, irrevocable, worldwide, royalty-free license to access, process, host, copy, adapt, translate, distribute, and display Customer Content to operate the services and provide security patches.

Section 10.2 Service Generated Data and Machine Learning Training
Zoom may generate service data, telemetry metadata, transcript titles, and usage files ("Service Generated Data"). 
Vast telemetry, performance scores, transcription summaries, and click streams remain the exclusive copyright of Zoom. 
AI TRAINING AND MACHINE LEARNING Opt-In: Under recent amendments, you agree that Zoom may use Customer Content, Service Generated Data, acoustic recordings, and face embeddings to train, fine-tune, analyze, and test our machine learning algorithms, artificial intelligence models, and automated customer support interfaces. You waive any claim to compensation or intellectual property royalties resulting from such machine learning models.

Section 12. Account Suspensions & Changes
Zoom reserves the right, in its sole discretion, to modify, restrict, suspend, or terminate your active account or access to the Zoom Services at any time, for any reason or no reason, without prior notice. Zoom shall not be liable to you or any third party for any suspension or termination of your account.`
  },
  {
    id: "tiktok",
    name: "TikTok (Data & Biometrics Snippet)",
    icon: "Smartphone",
    expectedRisk: "Critical",
    text: `TIKTOK TERMS OF SERVICE & PRIVACY POLICY
Effective Date: October 2024

1. Agreement and Revisions
By using our Short Video streaming services, you agree to these Terms. We may amend these Terms at any time by posting the updated Terms on our platform. Your continued use of the Platform after the date of the updated Terms constitutes your acceptance of the new Terms. If you do not agree, you must terminate your account immediately.

2. Tracking, Telemetry, and Biometric Details
In order to curate a customized "For You" feed, we track extreme amounts of device details, including, but not limited to: IP address, mobile carrier, keyboard keystroke pattern detectors, time zone, metadata of your uploaded files (even before publish), and GPS coordinate locators.
BIOMETRIC DATA CONSENT: WE MAY COLLECT COGNITIVE BIOMETRIC IDENTIFIERS FROM YOUR USER CONTENT, INCLUDING FACEPRINTS AND VOICEPRINTS, FOR AUTOMATED FILTER APPLICATION, USER SEGMENTATION, AND TARGETED SPONSORSHIPS. YOU ENTIRELY CONSENT TO OUR STORAGE AND ANALYSIS OF THESE BIOMETRICS IN ACCORDANCE WITH APPLICABLE JURISDICTIONS.

3. Intellectual Property License
When you post content on the Platform, you grant us an unconditional, irrevocable, non-exclusive, royalty-free, fully transferable, perpetual, worldwide license to use, copy, adapt, modify, publish, transmit, make derivative works of, and distribute your content in any format or medium whatsoever. This license includes the right of TikTok to monetize your video through advertisements, and you receive no royalty payments for such commercial use. You also grant other users a non-exclusive license to share and duet your content.

4. Class Action Waiver and Indemnification
YOU EXPRESSLY WAIVE ANY RIGHTS TO BRING ANY CLAIMS IN COURTS AS A RECONSTRUCTED CLASS ACTION ACTION. ALL CLAIM DISPUTES WILL BE SETTLED ON AN INDIVIDUAL BASIS UNDER SOLE BINDING REGIONAL CHANNELS.`
  },
  {
    id: "fair_doc",
    name: "OptimaSafe Direct (Consumer-Friendly Template)",
    icon: "ShieldAlert",
    expectedRisk: "Low",
    text: `OPTIMASAFE DIRECT TERMS & CONDITIONS
Effective Date: May 2026

1. Transparent Terms Agreement
We believe Terms of Service should protect both of us. We will notify you by email 30 days before making any material changes to these Terms. If you do not like the changes, you can close your account and export all your personal data at any click.

2. Clean Data Protection & No Sales
We collect only the bare minimum data needed to operate your dashboard (your email address, and saved records).
WE DO NOT SELL YOUR PERSONAL DATA TO ANY ADVERTISING COMPANIES, SPONSORS, OR DATA BROKERS.
NO PRIVATE BIOMETRIC TRACKING: We do not access your microphone, camera, keystrokes, or physical location without custom explicit opt-in permissions.

3. Complete Ownership of Your Files
You retain 100% ownership, copyright, and control of any document, text, or file uploaded to OptimaSafe. We grant ourselves a temporary, restricted license solely to perform processing on your screen—such document processing only happens in volatile memory and is never written to disk or used for training internal AI or ML systems.

4. Transparent Billing and Risk-Free Refunds
No tricky subscription renewals here. If you sign up for premium processing, you can cancel in one click directly from your account page, and our auto-renewal sends a reminder email 7 days before charging.
REFUND POLICY: If you are unsatisfied for any reason, we offer a 100% risk-free, no-questions-asked refund within 30 days of any bill.

5. Accessible Resolution of Disputes
We want to solve problems directly. If we have a dispute, you can file it in your local court or choose cooperative mediation. We do not force you into secret individual binding arbitration or coerce you into class action waivers.`
  }
];
