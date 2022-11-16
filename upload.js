const fs = require("fs")
const path = require("path")
const { 
	S3Client,
	CreateMultipartUploadCommand,
	UploadPartCommand,
	AbortMultipartUploadCommand,
	PutObjectCommand
} = require("@aws-sdk/client-s3");

const client = new S3Client({
	region: process.env.AWS_REGION,
	apiVersion: '2006-03-01'
});

/** 
 * Chunk Size = 5 MiB
 */ 
const chunkSize = Math.pow(1024, 2) * 5;

/**function createMultipartUpload(key) {
	const params = {
		Key: key,
		Bucket: process.env.AWS_BUCKET_NAME
	};

	try {
		const command = new CreateMultipartUploadCommand(params);
		return new Promise((resolve) => resolve(client.send(command)))
	} catch (error) {
		console.error(error);
		return null;
	} finally {
		
	}
}

function uploadPart(buffer, uploadId, partNumber, key) {
	const params = {
		Key: key,
		Bucket: process.env.AWS_BUCKET_NAME,
		Body: buffer,
		ContentLength: buffer.byteLength,
		PartNumber: partNumber,
		UploadId: uploadId
	};

	try {
		const command = new UploadPartCommand(params)
		return new Promise((resolve) => resolve(client.send(command)))
	} catch (error) {
		console.error(error)
		return null;
	} finally {

	}
}**/

function upload(buffer, partNumber, key) {
	const params = {
		Key: `${key}${partNumber}`,
		Bucket: process.env.AWS_BUCKET_NAME,
		Body: buffer,
		ContentLength: buffer.byteLength.toString(),
		Metadata: {
			IsMultipartUpload: "true",
			PartNumber: partNumber.toString()
		}
	};

	try {
		const command = new PutObjectCommand(params)
		return new Promise((resolve) => resolve(client.send(command)))
	} catch (error) {
		console.error(error)
		return null;
	} finally {

	}
}

async function uploadHelper(filePath) {
	const file = fs.readFileSync(filePath);
	const fileSize = file.byteLength;
	const iterations = Math.ceil(fileSize / chunkSize);

	const key = `upload/pdffile_${Math.random().toString(36).substring(2, 12)}/`

	try {
		//const res = await createMultipartUpload(key);
		//const uploadId = await res.UploadId;

		var arr = [];
		for (let i = 1; i <= iterations; i++) {
			//arr[i - 1] = uploadPart(file.slice((i - 1) * chunkSize, i * chunkSize), uploadId.toString(), i, key)
			arr[i - 1] = upload(file.slice((i - 1) * chunkSize, i * chunkSize), i, key)
		}
		const parts = await Promise.allSettled(arr)

		return parts;
	} catch (error) {
		console.error(error)
		return null;
	} finally {

	}
}

/**async function abortAllUploads() {
	// uploads: contains upload info fetched from aws s3api list-multipart-uploads
	var x = uploads.Uploads
	for (let i = 0; i < x.length; i++) {
		var temp = x[i]
		var params = {
			Key: temp.Key,
			Bucket: process.env.AWS_BUCKET_NAME,
			UploadId: temp.UploadId
		} 
		var command = new AbortMultipartUploadCommand(params)
		var response = await client.send(command)	
	}

	return null
}**/

module.exports.main = async (event, context) => {
	let result = null

	try {
		result = await uploadHelper('./10mbfile.pdf')
		console.log(result)
	} catch (error) {
		const response = {
			statusCode: 500, 
			body: "An Error Occurred"
		};
	
		return response;
	}

	return {
		statusCode: 200,
		body: "OK"
	};
}