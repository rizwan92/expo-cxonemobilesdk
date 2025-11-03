const { withXcodeProject } = require('@expo/config-plugins');

const addSPMDependenciesToMainTarget = (config, options) => withXcodeProject(config, config => {
  const { version, repositoryUrl, repoName, productName } = options;
  const xcodeProject = config.modResults;

  // Ensure XCRemoteSwiftPackageReference exists
  if (!xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference']) {
    xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference'] = {};
  }

  const packageReferenceUUID = xcodeProject.generateUuid();
  xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference'][`${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`] = {
    isa: 'XCRemoteSwiftPackageReference',
    repositoryURL: repositoryUrl,
    requirement: {
      kind: 'upToNextMajorVersion',
      minimumVersion: version,
    },
  };

  // Ensure XCSwiftPackageProductDependency exists
  if (!xcodeProject.hash.project.objects['XCSwiftPackageProductDependency']) {
    xcodeProject.hash.project.objects['XCSwiftPackageProductDependency'] = {};
  }

  const packageUUID = xcodeProject.generateUuid();
  xcodeProject.hash.project.objects['XCSwiftPackageProductDependency'][`${packageUUID} /* ${productName} */`] = {
    isa: 'XCSwiftPackageProductDependency',
    package: `${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`,
    productName: productName,
  };

  // Add package reference to PBXProject.packageReferences
  const projectId = Object.keys(xcodeProject.hash.project.objects['PBXProject'])[0];
  if (!xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences']) {
    xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences'] = [];
  }

  xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences'] = [
    ...xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences'],
    `${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`,
  ];

  // Wire product into Frameworks build phase so the main target links the package product
  const frameworkUUID = xcodeProject.generateUuid();
  xcodeProject.hash.project.objects['PBXBuildFile'] = xcodeProject.hash.project.objects['PBXBuildFile'] || {};
  xcodeProject.hash.project.objects['PBXBuildFile'][`${frameworkUUID}_comment`] = `${productName} in Frameworks`;
  xcodeProject.hash.project.objects['PBXBuildFile'][frameworkUUID] = {
    isa: 'PBXBuildFile',
    productRef: packageUUID,
    productRef_comment: productName,
  };

  const buildPhaseId = Object.keys(xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'])[0];
  if (!xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'][buildPhaseId]['files']) {
    xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'][buildPhaseId]['files'] = [];
  }

  xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'][buildPhaseId]['files'] = [
    ...xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'][buildPhaseId]['files'],
    `${frameworkUUID} /* ${productName} in Frameworks */`,
  ];

  return config;
});

module.exports = addSPMDependenciesToMainTarget;
