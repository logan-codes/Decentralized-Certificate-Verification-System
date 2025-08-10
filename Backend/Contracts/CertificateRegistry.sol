// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateRegistry {
    struct Certificate {
        string recipient;
        string issuer;
        string file;
        bool valid;
    }

    mapping(string => Certificate) public certificates; 
    address public owner;

    event CertificateIssued(string certificateId, string recipient, string issuer, string file);
    event CertificateRevoked(string certificateId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function issueCertificate(
        string memory certificateId,
        string memory recipient,
        string memory issuer,
        string memory file
    ) public onlyOwner {
        require(!certificates[certificateId].valid, "Certificate already exists");
        certificates[certificateId] = Certificate(recipient, issuer, file, true);
        emit CertificateIssued(certificateId, recipient, issuer, file);
    }

    function revokeCertificate(string memory certificateId) public onlyOwner {
        require(certificates[certificateId].valid, "Certificate does not exist");
        certificates[certificateId].valid = false;
        emit CertificateRevoked(certificateId);
    }

    function verifyCertificate(string memory certificateId) public view returns (string memory recipient, string memory issuer, string memory file, bool valid) {
        Certificate memory cert = certificates[certificateId];
        return (cert.recipient, cert.issuer, cert.file, cert.valid);
    }
} 