const fs = require("fs/promises")

const { 
	S3Client,
	GetObjectCommand
} = require("@aws-sdk/client-s3");

const client = new S3Client({
	region: process.env.AWS_REGION,
	apiVersion: '2006-03-01'
});

function getObject(partNumber, key) {
	const params = {
		Key: `${key}${partNumber}`,
		Bucket: process.env.AWS_BUCKET_NAME
	};

	const command = new GetObjectCommand(params)

	return new Promise(async (resolve, reject) => {		
		try {
			const response = await client.send(command)
			let temp = []
		
			response.Body.once('error', err => reject(err))
			response.Body.on('data', chunk => temp.push(chunk))
			response.Body.once('end', () => resolve(temp))
		} catch (err) {
			console.error(err)
			reject(err)
		} 
	})
}

async function downloadHelper(key) {
	// NUMBER OF PARTS OF FILE. LATER FETCH IT FROM INTERNAL DB.
	const iterations = 3; 
	// LATER IMPLEMENT DOWNLOADING PARTS IN RANGE.

	try {
		var arr = [];
		for (let i = 1; i <= iterations; i++) {
			arr[i - 1] = getObject(i, key)
		}
		const parts = await Promise.allSettled(arr)

		for (let i = 0; i < parts.length; i++) {
			parts[i] = Buffer.concat(parts[i].value)
		}

		await fs.writeFile('./newFile.pdf', Buffer.concat(parts));
		return 1;
	} catch (error) {
		console.error(error)
		return null;
	} finally {

	}
}

module.exports.main = async (event, context) => {
	let response = null

	try {
		// KEY: --data '{ "queryStringParameters": {"key":"upload/pdffile_/"}}' and /download?key=
		let key = event.queryStringParameters.key
		// LATER FETCH IT FROM INTERNAL DB. {ACTUAL_FILENAME: KEY_ASSOCIATED_IN_S3}
		
		response = await downloadHelper(key)
		if (response !== null) {
			response = {
				statusCode: 200,
				body: "OK"
			};
		}
	} catch (error) {
		console.error(error)
		response = {
			statusCode: 500, 
			body: "An Error Occurred"
		};
	}

	return response
}