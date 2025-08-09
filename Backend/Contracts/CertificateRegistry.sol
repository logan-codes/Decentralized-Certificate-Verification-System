// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateRegistry {
    struct Certificate {
        string ipfsHash;
        string recipient;
        string metadata;
        string issuer;
        bool valid;
    }

    mapping(string => Certificate) public certificates; 
    address public owner;

    event CertificateIssued(string certificateId, string ipfsHash, string recipient, string metadata, string issuer);
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
        string memory ipfsHash,
        string memory recipient,
        string memory metadata,
        string memory issuer
    ) public onlyOwner {
        require(!certificates[certificateId].valid, "Certificate already exists");
        certificates[certificateId] = Certificate(ipfsHash, recipient, metadata, issuer, true);
        emit CertificateIssued(certificateId, ipfsHash, recipient, metadata, issuer);
    }

    function revokeCertificate(string memory certificateId) public onlyOwner {
        require(certificates[certificateId].valid, "Certificate does not exist");
        certificates[certificateId].valid = false;
        emit CertificateRevoked(certificateId);
    }

    function verifyCertificate(string memory certificateId) public view returns (string memory ipfsHash, string memory recipient, string memory metadata, string memory issuer, bool valid) {
        Certificate memory cert = certificates[certificateId];
        return (cert.ipfsHash, cert.recipient, cert.metadata, cert.issuer, cert.valid);
    }
} 