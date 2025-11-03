const { withXcodeProject } = require('@expo/config-plugins');

const addSPMDependenciesToMainTarget = (config, options) => withXcodeProject(config, config => {
  const { version, repositoryUrl, repoName, productName } = options;
  const xcodeProject = config.modResults;

  // Ensure XCRemoteSwiftPackageReference exists and reuse existing one if present
  if (!xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference']) {
    xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference'] = {};
  }

  // Try to find an existing package reference by repositoryURL to avoid duplicates
  let packageReferenceUUID = null;
  const existingPackageRefs = xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference'];
  for (const key of Object.keys(existingPackageRefs)) {
    const ref = existingPackageRefs[key];
    if (ref && ref.repositoryURL === repositoryUrl) {
      packageReferenceUUID = key.split(' ')[0];
      break;
    }
  }

  if (!packageReferenceUUID) {
    packageReferenceUUID = xcodeProject.generateUuid();
    xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference'][`${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`] = {
      isa: 'XCRemoteSwiftPackageReference',
      repositoryURL: repositoryUrl,
      requirement: {
        kind: 'upToNextMajorVersion',
        minimumVersion: version,
      },
    };
  }

  // Ensure XCSwiftPackageProductDependency exists and reuse existing product dependency
  if (!xcodeProject.hash.project.objects['XCSwiftPackageProductDependency']) {
    xcodeProject.hash.project.objects['XCSwiftPackageProductDependency'] = {};
  }

  let packageUUID = null;
  const existingProducts = xcodeProject.hash.project.objects['XCSwiftPackageProductDependency'];
  for (const key of Object.keys(existingProducts)) {
    const prod = existingProducts[key];
    if (prod && prod.productName === productName && prod.package && prod.package.includes(packageReferenceUUID)) {
      packageUUID = key.split(' ')[0];
      break;
    }
  }

  if (!packageUUID) {
    packageUUID = xcodeProject.generateUuid();
    xcodeProject.hash.project.objects['XCSwiftPackageProductDependency'][`${packageUUID} /* ${productName} */`] = {
      isa: 'XCSwiftPackageProductDependency',
      package: `${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`,
      productName: productName,
    };
  }

  // Add package reference to PBXProject.packageReferences
  const projectId = Object.keys(xcodeProject.hash.project.objects['PBXProject'])[0];
  if (!xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences']) {
    xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences'] = [];
  }

  xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences'] = [
    ...xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences'],
    `${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`,
  ];

  // IMPORTANT: do NOT add a PBXBuildFile / Frameworks build-phase entry here.
  // If the package is declared in the podspec (CocoaPods SPM) the Pods target
  // will link the package product. Creating a second build file in the app
  // target causes duplicate-symbol / duplicate-framework link errors.
  // We only ensure the package reference and product dependency exist so Xcode
  // can resolve the package, but leave linking to CocoaPods.

  return config;
});

module.exports = addSPMDependenciesToMainTarget;
