#!/bin/sh

XMMS_ROOT=$1

if [ ! $XMMS_ROOT ]; then
	echo "Usage: $0 <path to xmms2 source tree>"
	exit
fi


PYTHONPATH=$XMMS_ROOT/waftools:$PYTHONPATH python code_generator.py $XMMS_ROOT/src/ipc.xml
