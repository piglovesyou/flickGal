#######################################################################
#
#
#
#######################################################################

USAGE_TEXT="\n
    ---- Usage ---- \n\n\
    ./run.sh setup    # fetch compiler
    ./run.sh compile  # compile jquery.flickgal.js
        \n"



LIBS_DIR=libs/

PLOVR_DIR=${LIBS_DIR}plovr/
PLOVR_REMOTE_DIR=http://plovr.googlecode.com/files/
PLOVR_JAR=plovr-eba786b34df9.jar
PLOVR_JAR_PATH=${PLOVR_DIR}${PLOVR_JAR}



case $1 in
    setup)
        mkdir ${LIBS_DIR} > /dev/null 2>&1
        PWD=`pwd`

        # Download plovr
        rm -rf ${PLOVR_DIR}
        wget -P ${PLOVR_DIR} ${PLOVR_REMOTE_DIR}${PLOVR_JAR}

        ;;

    compile)
        java -jar ${PLOVR_JAR_PATH} build plovr.json
        ;;

    *)
        echo -e $USAGE_TEXT
        ;;
esac
