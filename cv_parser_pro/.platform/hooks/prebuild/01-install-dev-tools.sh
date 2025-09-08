#!/bin/bash
# Install build tools required for native Node modules (like sqlite3)
yum groupinstall "Development Tools" -y
yum install gcc-c++ make -y
