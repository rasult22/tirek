import { ScrollView, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { H3, Body, Caption } from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { useThemeColors, spacing } from "../../lib/theme";

export default function PrivacyPolicyScreen() {
  const t = useT();
  const c = useThemeColors();

  return (
    <>
      <Stack.Screen options={{ title: t.profile.privacyPolicy }} />
      <ScrollView
        style={{ backgroundColor: c.bg }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Caption style={{ color: c.textLight, marginBottom: spacing.md }}>
          {t.profile.legalEnglishNote}
        </Caption>

        <H3 style={styles.h1}>Privacy Policy</H3>

        <Body style={styles.p}>
          This privacy policy applies to the tirek - панель психолога app
          (hereby referred to as "Application") for mobile devices that was
          created by Rassulzhan Turganov (hereby referred to as "Service
          Provider") as a Freemium service. This service is intended for use
          "AS IS".
        </Body>

        <H3 style={styles.h2}>Information Collection and Use</H3>
        <Body style={styles.p}>
          The Application collects information when you download and use it.
          This information may include information such as
        </Body>
        <Body style={styles.li}>• Your device's Internet Protocol address (e.g. IP address)</Body>
        <Body style={styles.li}>• The pages of the Application that you visit, the time and date of your visit, the time spent on those pages</Body>
        <Body style={styles.li}>• The time spent on the Application</Body>
        <Body style={styles.li}>• The operating system you use on your mobile device</Body>

        <Body style={styles.p}>
          The Application does not gather precise information about the
          location of your mobile device.
        </Body>
        <Body style={styles.p}>
          The Application uses Artificial Intelligence (AI) technologies to
          enhance user experience and provide certain features. The AI
          components may process user data to deliver personalized content,
          recommendations, or automated functionalities. All AI processing is
          performed in accordance with this privacy policy and applicable
          laws. If you have questions about the AI features or data
          processing, please contact the Service Provider.
        </Body>
        <Body style={styles.p}>
          The Service Provider may use the information you provided to contact
          you from time to time to provide you with important information,
          required notices and marketing promotions.
        </Body>
        <Body style={styles.p}>
          For a better experience, while using the Application, the Service
          Provider may require you to provide us with certain personally
          identifiable information, including but not limited to email, name,
          school name. The information that the Service Provider request will
          be retained by them and used as described in this privacy policy.
        </Body>

        <H3 style={styles.h2}>Third Party Access</H3>
        <Body style={styles.p}>
          Only aggregated, anonymized data is periodically transmitted to
          external services to aid the Service Provider in improving the
          Application and their service. The Service Provider may share your
          information with third parties in the ways that are described in
          this privacy statement.
        </Body>
        <Body style={styles.p}>
          Please note that the Application utilizes third-party services that
          have their own Privacy Policy about handling data. Below are the
          links to the Privacy Policy of the third-party service providers
          used by the Application:
        </Body>
        <Body style={styles.li}>• Google Analytics for Firebase</Body>
        <Body style={styles.li}>• Firebase Crashlytics</Body>
        <Body style={styles.li}>• Expo</Body>
        <Body style={styles.li}>• RevenueCat</Body>

        <Body style={styles.p}>
          The Service Provider may disclose User Provided and Automatically
          Collected Information:
        </Body>
        <Body style={styles.li}>• as required by law, such as to comply with a subpoena, or similar legal process;</Body>
        <Body style={styles.li}>• when they believe in good faith that disclosure is necessary to protect their rights, protect your safety or the safety of others, investigate fraud, or respond to a government request;</Body>
        <Body style={styles.li}>• with their trusted services providers who work on their behalf, do not have an independent use of the information we disclose to them, and have agreed to adhere to the rules set forth in this privacy statement.</Body>

        <H3 style={styles.h2}>Opt-Out Rights</H3>
        <Body style={styles.p}>
          You can stop all collection of information by the Application easily
          by uninstalling it. You may use the standard uninstall processes as
          may be available as part of your mobile device or via the mobile
          application marketplace or network.
        </Body>

        <H3 style={styles.h2}>Data Retention Policy</H3>
        <Body style={styles.p}>
          The Service Provider will retain User Provided data for as long as
          you use the Application and for a reasonable time thereafter. If
          you'd like them to delete User Provided Data that you have provided
          via the Application, please contact them at
          rasul.turganoff@gmail.com and they will respond in a reasonable
          time.
        </Body>

        <H3 style={styles.h2}>Children</H3>
        <Body style={styles.p}>
          The Service Provider does not use the Application to knowingly
          solicit data from or market to children under the age of 13.
        </Body>
        <Body style={styles.p}>
          The Application does not address anyone under the age of 13. The
          Service Provider does not knowingly collect personally identifiable
          information from children under 13 years of age. In the case the
          Service Provider discover that a child under 13 has provided
          personal information, the Service Provider will immediately delete
          this from their servers. If you are a parent or guardian and you are
          aware that your child has provided us with personal information,
          please contact the Service Provider (rasul.turganoff@gmail.com) so
          that they will be able to take the necessary actions.
        </Body>

        <H3 style={styles.h2}>Security</H3>
        <Body style={styles.p}>
          The Service Provider is concerned about safeguarding the
          confidentiality of your information. The Service Provider provides
          physical, electronic, and procedural safeguards to protect
          information the Service Provider processes and maintains.
        </Body>

        <H3 style={styles.h2}>Changes</H3>
        <Body style={styles.p}>
          This Privacy Policy may be updated from time to time for any reason.
          The Service Provider will notify you of any changes to the Privacy
          Policy by updating this page with the new Privacy Policy. You are
          advised to consult this Privacy Policy regularly for any changes, as
          continued use is deemed approval of all changes.
        </Body>
        <Body style={styles.p}>
          This privacy policy is effective as of 2026-05-06.
        </Body>

        <H3 style={styles.h2}>Your Consent</H3>
        <Body style={styles.p}>
          By using the Application, you are consenting to the processing of
          your information as set forth in this Privacy Policy now and as
          amended by us.
        </Body>

        <H3 style={styles.h2}>Contact Us</H3>
        <Body style={styles.p}>
          If you have any questions regarding privacy while using the
          Application, or have questions about the practices, please contact
          the Service Provider via email at rasul.turganoff@gmail.com.
        </Body>

        <View style={{ height: spacing["2xl"] }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  h1: {
    marginBottom: spacing.md,
  },
  h2: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  p: {
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  li: {
    lineHeight: 22,
    marginBottom: 4,
    paddingLeft: spacing.sm,
  },
});
