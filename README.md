This is a simple test to understand how to use [CollectionFS](https://github.com/CollectionFS/Meteor-CollectionFS) and [cfs-s3](https://github.com/CollectionFS/Meteor-cfs-s3), especially to get also direct links to uploaded files.

To try it out, create two buckets on your S3 accounts, here called BACKET_A and BACKET_B.
BACKET_A will be for public access, while BUCKET_B for private data.

In order to set-up S3 access, follow the instruction on *S3 Setup* paragpraph on the [cfs-s3](https://github.com/CollectionFS/Meteor-cfs-s3) README.md and paste the following policy

``` json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::*"
    },
    {
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:GetObjectAcl",
        "s3:DeleteObject",
        "s3:DeleteObjectAcl"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:s3:::BUCKET_A/*",
        "arn:aws:s3:::BUCKET_B/*"
      ]
    }
  ]
}
```

After this, in order to get public access to BUCKET_A, go to your bucket properties, look for the section *Permissions*, press *Edit bucket policy* and paste the following:

``` json
{
	"Statement": [
		{
			"Sid": "AddPerm",
			"Effect": "Allow",
			"Principal": {
				"AWS": "*"
			},
			"Action": "s3:GetObject",
			"Resource": "arn:aws:s3:::BUCKET_A/*"
		}
	]
}
```

Honestly I supposed this not to be necessary to get public access to uploaded files, but setting ACL option to *public* neither setting it to *public-read* succeded in setting public access to uploaded files. I also tried to add `'x-amz-acl': 'public-read'` among the options for the store, but without success...  I'd need to study a bit more.


Then open settings.js and put in your buckets' *name*, *region*, and *directUrlBase*.
Finally insert into start.sh your credentials to access S3 for the user created as explained above.

...and run the example with '''sh run.sh''' (I'm using linux...)


What I came up with to provide direct links to uploaded files is this global helper (have a look near the end of *lib/models/images.js*)

``` javascript
if (Meteor.isClient) {
    Handlebars.registerHelper('images_full_res_url', function() {
        if (this.isMounted() && this.isUploaded() && this.getFileRecord())
            return Meteor.settings.public.AWS.images_full_res.directUrlBase + '/' + imageStore.folder + '/' + imageStore.fileKey(this);
        return this.url({store: 'images_full_res'});
    });
}
```

which permits something like this:

``` html
{{#each images}}
    <div><img src="{{images_full_res_url}}" alt="full image"></div>
{{else}}
    No pictures uploaded yet.
{{/each}}
```

Basically I provide the base url for direct access into the settings.js file and use the image *store* object to get the actual folder and file names.


when you upload an image you'll get to images in the top list. One for the thumbnail and the other for the full-resolution version.
The link for the thumbnail is the regular one provided by cfs, while the other is a direct link to the S3 bucket.
You'll probably notice that this last one is usually broken just after the image upload, but it works if you reload the page.
This is probably due to the latency needed by S3 to make the file available. I also tried to exploit the *isUploaded()* method of FS.File object, but still seems to reactive with respect to actual availability of S3.

The feature about getting direct links from cfs-s3 object is currently tracked by the developers of [CollectionFS](https://github.com/CollectionFS/Meteor-CollectionFS) and you can find more details reading the discussion of issues [#249](https://github.com/CollectionFS/Meteor-CollectionFS/issues/249) [#175](https://github.com/CollectionFS/Meteor-CollectionFS/issues/175) [#138](https://github.com/CollectionFS/Meteor-CollectionFS/issues/138).
Since I'm a newbie here, I better wait the developer to come up with an integrated solutions, not to make silly proposals.
For now I think I'll go with helpers like the one used here. The only problem would be to write one helper for each collectionFS, but it's something I can live with.


Any suggestions or comments are very welcome!
