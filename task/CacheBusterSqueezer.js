/**
 * Trim CacheBuster info file by removing entries related to files omitted from build.
 */
// eslint-disable-next-line no-unused-vars
module.exports = async function ChacheBusterSqueezer({dependencies, log, options, taskUtil, workspace}) {
  const config = options.configuration;
  const cachebusterInfoResources = await workspace.byGlob("**/sap-ui-cachebuster-info.json");
  if (cachebusterInfoResources.length !== 1) {
    return;
  }
  const cachebusterInfoRes = cachebusterInfoResources[0];
  let cachebusterInfo = JSON.parse(await cachebusterInfoRes.getString());

  for (var resourcePath in cachebusterInfo) {
    let resource = await workspace.byPath("/resources/"+options.projectNamespace+"/"+resourcePath);
    if(taskUtil.getTag(resource, taskUtil.STANDARD_TAGS.OmitFromBuildResult)) {
      delete cachebusterInfo[resourcePath];
    }
  }
  cachebusterInfoRes.setString(JSON.stringify(cachebusterInfo, null, 2));
  workspace.write(cachebusterInfoRes);
};
