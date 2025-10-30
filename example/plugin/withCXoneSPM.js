const { withXcodeProject } = require('@expo/config-plugins');

const withCXoneSPM = (config, options) =>
  withXcodeProject(config, (config) => {
    // reference the "props"
    const { version, repositoryUrl, repoName, productName } = options;
    // reference xcodeProject
    const xcodeProject = config.modResults;
    // get XCRemoteSwiftPackageReference section
    const spmReferences = xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference'];
    // if doesn't exist (this is our first SPM package) create empty object
    if (!spmReferences) {
      xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference'] = {};
    }
    // generate new ID
    const packageReferenceUUID = xcodeProject.generateUuid();
    // add XCRemoteSwiftPackageReference section
    xcodeProject.hash.project.objects['XCRemoteSwiftPackageReference'][
      `${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`
    ] = {
      isa: 'XCRemoteSwiftPackageReference',
      repositoryURL: repositoryUrl,
      requirement: {
        kind: 'upToNextMajorVersion',
        minimumVersion: version,
      },
    };

    // get XCSwiftPackageProductDependency section
    const spmProducts = xcodeProject.hash.project.objects['XCSwiftPackageProductDependency'];
    // if doesn't exist (this is our first SPM package) create empty object
    if (!spmProducts) {
      xcodeProject.hash.project.objects['XCSwiftPackageProductDependency'] = {};
    }
    // generate new ID
    const packageUUID = xcodeProject.generateUuid();
    // add XCSwiftPackageProductDependency section
    xcodeProject.hash.project.objects['XCSwiftPackageProductDependency'][
      `${packageUUID} /* ${productName} */`
    ] = {
      isa: 'XCSwiftPackageProductDependency',
      // from step before
      package: `${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`,
      productName: productName,
    };

    // get main project ID
    const projectId = Object.keys(xcodeProject.hash.project.objects['PBXProject']).at(0);
    // create empty array for package references if it doesn't exist
    if (!xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences']) {
      xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences'] = [];
    }
    // add our package reference (use ID from first step)
    xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences'] = [
      ...xcodeProject.hash.project.objects['PBXProject'][projectId]['packageReferences'],
      `${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`,
    ];

    // generate new ID
    const frameworkUUID = xcodeProject.generateUuid();
    // add comment and reference to our framework in PBXBuildFile section
    xcodeProject.hash.project.objects['PBXBuildFile'][`${frameworkUUID}_comment`] =
      `${productName} in Frameworks`;
    xcodeProject.hash.project.objects['PBXBuildFile'][frameworkUUID] = {
      isa: 'PBXBuildFile',
      productRef: packageUUID,
      productRef_comment: productName,
    };

    // get first build phase
    const buildPhaseId = Object.keys(
      xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'],
    ).at(0);
    // create empty array for files if it doesn't exist
    if (!xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'][buildPhaseId]['files']) {
      xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'][buildPhaseId]['files'] = [];
    }
    // add our framework reference (use ID from step 4)
    xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'][buildPhaseId]['files'] = [
      ...xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'][buildPhaseId]['files'],
      `${frameworkUUID} /* ${productName} in Frameworks */`,
    ];
    // return all the changes
    return config;
  });

module.exports = withCXoneSPM
