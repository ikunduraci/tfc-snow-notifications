// Author: Ibrahim Kunduraci

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
	var mac = new CertificateEncryption(); 
	
	// notification_token is configured per workspace. TFC provide a SHA-512 HMAC of the full request body using the
	// notification_token as the key. This is stored in the x-tfe-notification-signature header. See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/notification-configurations#notification-authenticity for more info.

    // An additional column with the type 'Password (2 Way Encrypted) will need to be added. In this example,
    // we're using the default x_325709_terraform_config table. The notification token will be stored here.
	var tokenTable = new GlideRecord('x_325709_terraform_config');
	tokenTable.setLimit(1);
	tokenTable.query();
	while (tokenTable.next()) {
		var notification_token = gs.base64Encode(tokenTable.notification_token.getDecryptedValue());
	}

    // the generateMac() function requires the token to be base64 encoded.
	var generated_hmac = mac.generateMac(notification_token, "HmacSHA512", JSON.stringify(request.body.data));
	
	// GlideStringUtil() is not available in scoped applications; a seperate script include
    // is required to handle the base64 to HEX conversion.
	var converter = new Base64ToHexConverter();
	var our_hmac = converter.convert(generated_hmac);

    // Terraform Cloud computes the SHA-512 HMAC for the request body and sends it in the 'x-tfe-notification-signature' header.
	var tfc_hmac = request.headers['x-tfe-notification-signature'];
	
    // If the TFC computed HMAC and our HMAC are equal, we know the request is authentic.
	if(tfc_hmac == our_hmac){
		var requestBody = request.body.data;
		var notification_type = requestBody['notifications'][0];
		
        // Check to see if this is the first time configuration for the notification, or if it's
        // just a test notification. If so, return 200. Without this, creating the notification
        // trigger fails.
		if(notification_type == 'verification' || notification_type["trigger"] == "verification"){
			response.setStatus(200)
			gs.info("Trigger processed successfully: " + JSON.stringify(requestBody));
			return;
		} else {
			var workspace_id = requestBody['workspace_id'];
			var workspace_name = requestBody['workspace_name'];
			var run_status = requestBody['notifications'][0]['run_status'];

            // Purely used for logging purposes.
			var object = {
				"workspace_name": workspace_name,
				"workspace_id": workspace_id,
				"run_status": run_status
			}
			gs.info("Request object: " + JSON.stringify(object));
            // Query the x_325709_terraform_terraform table and look for the workspace_id. 
			var tfTable = 'x_325709_terraform_terraform';
			var gr = new GlideRecord(tfTable);
			gr.addQuery('workspace_id', workspace_id);
			gr.query();
			// Error handling for if/when the workspace_id doesn't exist.
			if(!gr.hasNext()){
				response.setError(new sn_ws_err.NotFoundError('No workspace found.'));
				response.setStatus(404);
				gs.info("Workspace ID does not exist in table: " + tfTable);
				return;
			}
			// otherwise update the workspace_status column with the run_status.
			if(gr.next()){
				gr.last_known_state = run_status;
				gr.update();
				gs.info(JSON.stringify(object) + " was updated in table: " + tfTable);
			}
			response.setStatus(200)
		}
	} else {
		// 401 unauthorized requests.
		gs.info("Invalid HMAC.");
		gs.info(JSON.stringify(request.body.data));
		response.setError(new sn_ws_err.NotFoundError('Unauthorized.'));
		response.setStatus(401);
		gs.warn("Unauthorized request: " + JSON.stringify(request.headers));
		return;
	}

})(request, response);
