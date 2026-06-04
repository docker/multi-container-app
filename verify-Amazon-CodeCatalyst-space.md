// AWS Accouunt
Verify Amazon CodeCatalyst space
Paste the verification token from Amazon CodeCatalyst to verify this AWS account. You can remove this AWS account at any time. Adding an AWS account is required in order to create a space in Amazon CodeCatalyst.
Verification token
Paste the verification token generated from the create space page in Amazon CodeCatalyst.

```9169941d-c138-4c22-885f-f32a09018dca```

Requested by
williamrobertson28@gmail.com
AWSRoleForCodeCatalystSupport role
This role allows you to create and view AWS Support cases in CodeCatalyst. Without the role you will not be able to receive technical support via the AWS Management Console for Amazon CodeCatalyst.

Add AWSRoleForCodeCatalystSupport

Role permissions and trust relationship
Role name
AWSRoleForCodeCatalystSupport
Permissions

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Allow": [
        "support:DescribeAttachment",
        "support:DescribeCaseAttributes",
        "support:DescribeCases",
        "support:DescribeCommunications",
        "support:DescribeIssueTypes",
        "support:DescribeServices",
        "support:DescribeSeverityLevels",
        "support:DescribeSupportLevel",
        "support:SearchForCases",
        "support:AddAttachmentsToSet",
        "support:AddCommunicationToCase",
        "support:CreateCase",
        "support:InitiateCallForCase",
        "support:InitiateChatForCase",
        "support:PutCaseAttributes",
        "support:RateCaseCommunication",
        "support:ResolveCase"
      ],
      "Resource": "*"
    }
  ]
}
``