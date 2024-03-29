/**
 * Move output files to folders according to CacheBuster-generated file.
 * Still have issues with some issues with "static files" (like CSS), which
 * doesn't move properly to correct folder.
 */
// eslint-disable-next-line no-unused-vars
module.exports = async function ChacheBusterShaker({dependencies, log, options, taskUtil, workspace}) {
  const config = options.configuration;
  const cachebusterInfoResources = await workspace.byGlob("**/sap-ui-cachebuster-info.json");
  if (cachebusterInfoResources.length !== 1) {
    return;
  }
  let cachebusterInfo = JSON.parse(await cachebusterInfoResources[0].getString());

  for (var resourcePath in cachebusterInfo) {
    if (config.excludes?.includes(resourcePath)) {
      continue;
    }
    let resource = await workspace.byPath("/resources/"+options.projectNamespace+"/"+resourcePath);
    if(resource && !taskUtil.getTag(resource, taskUtil.STANDARD_TAGS.OmitFromBuildResult)) {
      // TODO: find a better way to move file, because with CLI v3 it seems to flush file to workspace before reaching here,
      //       and a simple setPath will actually create a second file in different path instead moving it.
      const movedResource = await resource.clone();
      taskUtil.setTag(resource, taskUtil.STANDARD_TAGS.OmitFromBuildResult)
      movedResource.setPath("/resources/"+options.projectNamespace+ "/~" + cachebusterInfo[resourcePath] + "~/"+resourcePath);
      workspace.write(movedResource);
    }
  }
};
