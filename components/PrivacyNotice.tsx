import { site } from '@/lib/config';

/**
 * DRAFT privacy notice for AMI's legal adviser to review before real use.
 * Bump site.privacyVersion in lib/config.ts whenever this text changes materially.
 */
export function PrivacyNotice() {
  return (
    <div className="prose-ami text-[0.95rem]">
      <p className="rounded-xl bg-gold-100 p-3 text-sm">
        Draft wording (version {site.privacyVersion}). To be reviewed by {site.org}&apos;s legal adviser before the tool is used with the public.
      </p>
      <h3>Who we are</h3>
      <p>
        {site.name} is run for the {site.org} (AMI) at the {site.event}, {site.venue}. AMI decides why and how your information is used. The platform is operated on AMI&apos;s behalf by IPWORTH Ltd.
      </p>
      <h3>What we collect</h3>
      <ul>
        <li>Your email address, which you use to sign in.</li>
        <li>Your name, organisation, country, what you bring to the festival, what you hope for, and optionally a phone number.</li>
        <li>Connections you log: who you met, what happened, the stage reached, any amount of money involved, and goals it contributes to.</li>
        <li>Private notes you choose to add. These are never shown to the other person.</li>
        <li>If you log someone who has not registered, their name and, only if you provide it, their email or phone number.</li>
      </ul>
      <p>Please do not enter information about children or sensitive personal details.</p>
      <h3>Why we use it</h3>
      <ul>
        <li>To let you record and follow up your connections, and to email you a summary and reminders.</li>
        <li>To let the other person confirm a connection you logged with them.</li>
        <li>To give AMI totals and evidence about how culture leads to trade and jobs, for planning future festivals and for reporting to funders and partners.</li>
      </ul>
      <h3>Who can see it</h3>
      <ul>
        <li>You can see your own information and connections.</li>
        <li>The other person in a connection can see what you logged about them: what happened, the stage, and any amount. They cannot see your private notes.</li>
        <li>Other participants can find your name, country and type of work so they can log a connection with you.</li>
        <li>The AMI team and its platform operator can see registrations and connections in order to run the festival. They cannot read your private notes.</li>
        <li>Funders and the public see only totals and anonymised examples. Your name is used only if you tick the optional box to agree.</li>
      </ul>
      <h3>People you add</h3>
      <p>
        Only add someone&apos;s contact details if they are happy to be contacted. Their profile stays unverified until they register and confirm. We do not email people who have not registered.
      </p>
      <h3>How long we keep it</h3>
      <p>[AMI to set a retention period, for example: personal details are removed or anonymised 24 months after the festival. Anonymised totals are kept.]</p>
      <h3>Your choices</h3>
      <ul>
        <li>See, correct or save a copy of your information at any time from the Account page.</li>
        <li>Change the optional permissions at any time.</li>
        <li>Delete your account and information from the Account page. Connections others logged about you stay in their records without your name.</li>
      </ul>
      <h3>The law</h3>
      <p>
        AMI will handle personal information in line with applicable data protection law, including South Africa&apos;s Protection of Personal Information Act (POPIA). [Legal adviser to confirm the responsible party, operator arrangements, cross-border transfer wording and the contact for the Information Officer.]
      </p>
      {site.contactEmail ? <p>Questions: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p> : null}
    </div>
  );
}
