/**
 * Move output files to folders according to CacheBuster-generated file.
 * Still have issues with some issues with "static files" (like CSS), which
 * doesn't move properly to correct folder.
 */
// eslint-disable-next-line no-unused-vars
module.exports = async function ChacheBusterShaker({ workspace, dependencies, taskUtil, options }) {
  const config = options.configuration;
  const cachebusterInfoResources = await workspace.byGlob("**/sap-ui-cachebuster-info.json");
  if (cachebusterInfoResources.length !== 1) {
    return;
  }
  let cachebusterInfo = JSON.parse(await cachebusterInfoResources[0].getString());

  for (var resourcePath in cachebusterInfo) {
    let resource = await workspace.byPath("/resources/"+options.projectNamespace+"/"+resourcePath);
    if(resource && !taskUtil.getTag(resource, taskUtil.STANDARD_TAGS.OmitFromBuildResult)) {
      resource.setPath("/resources/"+options.projectNamespace+ "/~" + cachebusterInfo[resourcePath] + "~/"+resourcePath);
    }
  }
};
