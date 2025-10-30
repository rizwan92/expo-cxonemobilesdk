// Lightweight Expo config plugin to add Swift Package Manager dependencies to the Xcode project.
// Based on community patterns for mutating PBXProject to add XCRemoteSwiftPackageReference and XCSwiftPackageProductDependency.

const { withXcodeProject, IOSConfig, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {{ repositoryUrl: string; product: string; minVersion?: string; exactVersion?: string; branch?: string }} SPMDef
 * @typedef {{ packages?: SPMDef[]; targetName?: string }} PluginProps
 */

function getAppTargetName(projectRoot, targetName) {
  if (targetName) return targetName;
  const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
  return projectName;
}

function addSwiftPackageToProject(project, { repositoryUrl, product, minVersion, exactVersion, branch }, targetName) {
  const projectSection = project.hash.project.objects.PBXProject;
  const projectUuid = Object.keys(projectSection).find((k) => typeof projectSection[k] === 'object');
  const mainProject = projectSection[projectUuid];

  const packageRefSection = project.hash.project.objects.XCRemoteSwiftPackageReference || (project.hash.project.objects.XCRemoteSwiftPackageReference = {});
  const productDepSection = project.hash.project.objects.XCSwiftPackageProductDependency || (project.hash.project.objects.XCSwiftPackageProductDependency = {});
  const buildFileSection = project.hash.project.objects.PBXBuildFile;

  // Create the XCRemoteSwiftPackageReference
  const pkgId = project.generateUuid();
  const requirement = {};
  if (exactVersion) {
    requirement.kind = 'exactVersion';
    requirement.version = exactVersion;
  } else if (branch) {
    requirement.kind = 'branch';
    requirement.branch = branch;
  } else {
    requirement.kind = 'upToNextMajorVersion';
    requirement.minimumVersion = minVersion || '1.0.0';
  }
  packageRefSection[pkgId] = {
    isa: 'XCRemoteSwiftPackageReference',
    repositoryURL: repositoryUrl,
    requirement,
  };

  // Attach the package reference to the project attributes
  mainProject.attributes = mainProject.attributes || {};
  const pkgRefs = (mainProject.attributes.PackageReferences = mainProject.attributes.PackageReferences || []);
  if (!pkgRefs.find((r) => r.value === pkgId)) {
    pkgRefs.push({ value: pkgId });
  }

  // Create product dependency for the target
  const productId = project.generateUuid();
  productDepSection[productId] = {
    isa: 'XCSwiftPackageProductDependency',
    productName: product,
    package: pkgId,
  };

  // Attach product to native target
  const nativeTargets = project.hash.project.objects.PBXNativeTarget;
  const targetUuid = Object.keys(nativeTargets).find((k) => {
    const t = nativeTargets[k];
    return typeof t === 'object' && (t.name === targetName || t.productName === targetName);
  });
  if (!targetUuid) {
    throw new Error(`Could not find iOS target named '${targetName}'.`);
  }
  const target = nativeTargets[targetUuid];
  target.packageProductDependencies = target.packageProductDependencies || [];
  if (!target.packageProductDependencies.find((r) => r.value === productId)) {
    target.packageProductDependencies.push({ value: productId });
  }

  // Add build file entry so the product appears in Frameworks phase
  const buildId = project.generateUuid();
  buildFileSection[buildId] = {
    isa: 'PBXBuildFile',
    productRef: productId,
    fileRef: productId,
  };

  // Ensure Frameworks build phase exists and attach
  const frameworksPhase = project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', targetUuid, project.getFirstTarget().firstTarget);
  const frameworksUuid = frameworksPhase && frameworksPhase.buildPhase ? frameworksPhase.buildPhase : project.getFirstTarget().firstTarget.frameworksBuildPhase;
  const frameworksSection = project.hash.project.objects.PBXFrameworksBuildPhase[frameworksUuid];
  frameworksSection.files = frameworksSection.files || [];
  if (!frameworksSection.files.find((f) => f.value === buildId)) {
    frameworksSection.files.push({ value: buildId });
  }
}

function addSwiftSourcesToAppTarget(project, projectRoot, targetName) {
  // Discover Swift sources from this package's ios/ folder
  const pkgRoot = path.dirname(require.resolve('expo-cxonemobilesdk/plugin/withCXoneSPM.js'));
  const iosDir = path.join(pkgRoot, '..', 'ios');
  if (!fs.existsSync(iosDir)) return;
  const files = fs.readdirSync(iosDir).filter((f) => f.endsWith('.swift'));
  if (files.length === 0) return;

  // Create/locate a group for sources
  const groupName = 'ExpoCxonemobilesdk';
  const group = project.addPbxGroup([], groupName, groupName);
  const groupKey = group.uuid;
  const mainGroupId = project.getFirstProject().firstProject.mainGroup;
  const mainGroup = project.hash.project.objects.PBXGroup[mainGroupId];
  if (!mainGroup.children.find((c) => c.value === groupKey)) {
    mainGroup.children.push({ value: groupKey, comment: groupName });
  }

  // Add files and sources build phase entries
  const nativeTargets = project.hash.project.objects.PBXNativeTarget;
  const targetUuid = Object.keys(nativeTargets).find((k) => {
    const t = nativeTargets[k];
    return typeof t === 'object' && (t.name === targetName || t.productName === targetName);
  });
  if (!targetUuid) throw new Error(`Could not find iOS target named '${targetName}'.`);

  files.forEach((fname) => {
    const abs = path.join(iosDir, fname);
    const rel = path.relative(projectRoot, abs);
    if (!project.hasFile(rel)) {
      project.addSourceFile(rel, { target: targetUuid, lastKnownFileType: 'sourcecode.swift' }, groupName);
    }
  });
}

const withCXoneSPM = (config, /** @type {PluginProps} */ props = {}) => {
  return withXcodeProject(config, (conf) => {
    const project = conf.modResults;
    const targetName = getAppTargetName(conf.modRequest.projectRoot, props.targetName);
    const pkgs = props.packages || [];
    pkgs.forEach((pkg) => addSwiftPackageToProject(project, pkg, targetName));
    // Also add the Swift sources from this package to the app target so they compile against SPM deps
    addSwiftSourcesToAppTarget(project, conf.modRequest.projectRoot, targetName);
    return conf;
  });
};

module.exports = createRunOncePlugin(withCXoneSPM, 'with-cxone-spm', '1.0.0');
