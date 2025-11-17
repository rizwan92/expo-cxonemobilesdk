const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Ensures the host app can override android:fullBackupContent even though
 * chat-sdk-core declares its own value. Adds the tools namespace (if needed)
 * and appends android:fullBackupContent to tools:replace on the <application>
 * element so manifest merging succeeds without manual edits.
 */
module.exports = function withAndroidFullBackupFix(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest?.application?.length) {
      return cfg;
    }

    const application = manifest.application[0];
    application.$ = application.$ ?? {};

    if (!application.$['xmlns:tools']) {
      application.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const attr = 'android:fullBackupContent';
    if (application.$['tools:replace']) {
      const values = application.$['tools:replace']
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (!values.includes(attr)) {
        values.push(attr);
      }
      application.$['tools:replace'] = values.join(',');
    } else {
      application.$['tools:replace'] = attr;
    }

    return cfg;
  });
};
