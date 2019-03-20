var AwsExports = {
    "aws_appsync_graphqlEndpoint": "https://xla7qczlgbexpdnpbb5jahr2v4.appsync-api.us-west-2.amazonaws.com/graphql",
    "aws_appsync_region": "us-west-2",
    "aws_appsync_authenticationType": "AWS_IAM",
    Auth: {
        // REQUIRED - Amazon Cognito Identity Pool ID
        identityPoolId: 'us-west-2:483ffa7b-a5ca-472e-9fd5-abfff9c335f0', 
        // REQUIRED - Amazon Cognito Region
        region: 'us-west-2', 
        // OPTIONAL - Amazon Cognito User Pool ID
        userPoolId: 'us-west-2_PkZb6onNf',
        // OPTIONAL - Amazon Cognito Web Client ID
        userPoolWebClientId: '7ev3dsi43umdf23l896bnl8ro7'
    },
    Storage: {
        bucket: 'disneyapp3',
        region: 'us-west-2'
    }
};

export default AwsExports;