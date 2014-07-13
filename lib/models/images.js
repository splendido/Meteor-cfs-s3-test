
FS.debug = true;

var defaultImageFilter = {
    maxSize: 5242880, // 5 MB
    allow: {
        contentTypes: ['image/*']
    }
};

// Stores
//

var imageStore = new FS.Store.S3("images_full_res", {
    region: Meteor.settings.public.AWS.images_full_res.region,
    bucket: Meteor.settings.public.AWS.images_full_res.bucket,
    folder: Meteor.settings.public.AWS.images_full_res.folder,
    ACL: Meteor.settings.public.AWS.images_full_res.ACL
});

var changeExtension = function(fname, ext) {
    return fname.substr(0, fname.lastIndexOf(".")) + "." + ext;
};

var thumbnailStore = new FS.Store.S3("images_thumb", {
    region: Meteor.settings.public.AWS.images_thumb.region,
    bucket: Meteor.settings.public.AWS.images_thumb.bucket,
    folder: Meteor.settings.public.AWS.images_thumb.folder,
    ACL: Meteor.settings.public.AWS.images_thumb.ACL,
    transformWrite: function(fileObj, readStream, writeStream) {
        // Transform the image into a 64x64px PNG thumbnail.
        // We must change the name and type, but the new size will be automatically detected and set.
        fileObj.copies.images_thumb.name = changeExtension(fileObj.copies.images_thumb.name, 'png');
        fileObj.copies.images_thumb.type = 'image/png';
        gm(readStream).resize(64).stream('PNG').pipe(writeStream);
    }
});

// Collection FS
//

Images = new FS.Collection("images", {
    stores: [thumbnailStore, imageStore],
    filter: defaultImageFilter
});

if (Meteor.isClient) {
    UI.registerHelper('images_full_res_url', function() {
        FS.debug && console.log('uploaded? ' + this.isUploaded());
        if (this.isMounted() && this.isUploaded() && this.getFileRecord()) {
            FS.debug && console.log('giving DIRECT url for ' + this.name);
            var adjustedRegion = Meteor.settings.public.AWS.images_full_res.directUrlBase;
            adjustedRegion = adjustedRegion.replace("REGION", imageStore.region);
            var s3Url = adjustedRegion + '/' + imageStore.folder + '/' + imageStore.fileKey(this);
            console.log("full s3 url "+ s3Url);
            return s3Url;
        }
        FS.debug && console.log('giving UNdirect url for ' + this.name + " images_full_res");
        var theUrl = this.url({
            store: 'images_full_res'
        });
        console.log("full theUrl: " + theUrl);
        return theUrl;
    });

    UI.registerHelper('images_thumb_res_url', function() {
        FS.debug && console.log('uploaded? ' + this.isUploaded());
        if (this.isMounted() && this.isUploaded() && this.getFileRecord()) {
            FS.debug && console.log('giving DIRECT url for ' + this.name);
            var adjustedRegion = Meteor.settings.public.AWS.images_thumb.directUrlBase;
            adjustedRegion = adjustedRegion.replace("REGION", thumbnailStore.region);
            var s3Url = adjustedRegion + '/' + thumbnailStore.folder + '/' + thumbnailStore.fileKey(this);
            console.log("thumb s3 url "+ s3Url);
            return s3Url;
        }
        FS.debug && console.log('giving UNdirect url for ' + this.name + "images_thumb");
        var theUrl = this.url({
            store: "images_thumb"
        });
        console.log("thumb theUrl: " + theUrl);
        return theUrl;
    });
}
