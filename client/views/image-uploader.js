
Template.imageUploader.images = function () {
    return Images.find();
};

Template.imageUploader.events({
    'change #files': function(event, temp) {
      console.log('files changed');
      FS.Utility.eachFile(event, function(file) {
        var fileObj = new FS.File(file);
        Images.insert(fileObj);
      });
    },
    'click .btnRemove': function(event, temp) {
      this.remove();
    }
});
